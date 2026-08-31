/* ─────────────────────────────────────────────────────────────────────────────
   Application Load Balancer — health checking and the origin-verify gate.

   ── Why the default action is 403 ───────────────────────────────────────────
   The load balancer has a public DNS name. Anyone who finds it could otherwise
   reach the application directly, skipping CloudFront — and with it the WAF,
   the rate limiting and the caching.

   Two independent layers stop that. The security group only admits CloudFront's
   published edge ranges (see modules/network). And here, the listener's DEFAULT
   action is a flat 403: traffic is only forwarded when it carries the
   X-Origin-Verify header that CloudFront is configured to add. The prefix list
   could go stale; the header cannot be guessed.

   ── HTTPS is optional, on purpose ───────────────────────────────────────────
   ACM will not issue a certificate for *.elb.amazonaws.com, so HTTPS here needs
   a real hostname (origin.vitorra.org) and DNS validation records at GoDaddy.
   Until those exist, certificate_arn is null and the listener serves HTTP so
   the stack can be verified end to end. Set certificate_arn and HTTP becomes a
   permanent redirect to HTTPS.
   ───────────────────────────────────────────────────────────────────────────── */

resource "random_password" "origin_verify" {
  length  = 48
  special = false # keep it header-safe
}

resource "aws_secretsmanager_secret" "origin_verify" {
  name        = "${var.name_prefix}/origin-verify"
  description = "Shared secret CloudFront sends as X-Origin-Verify; the ALB rejects anything without it."

  # Let the name be reused immediately if this is ever torn down and rebuilt.
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "origin_verify" {
  secret_id     = aws_secretsmanager_secret.origin_verify.id
  secret_string = random_password.origin_verify.result
}

resource "aws_lb" "this" {
  name               = var.name_prefix
  load_balancer_type = "application"
  internal           = false
  subnets            = var.subnet_ids
  security_groups    = [var.security_group_id]

  # Production should be awkward to delete by accident.
  enable_deletion_protection = var.deletion_protection

  # Next.js streams server-rendered responses; the default 60s is fine, but be
  # explicit so nobody wonders later.
  idle_timeout = 60

  drop_invalid_header_fields = true
}

resource "aws_lb_target_group" "this" {
  name        = var.name_prefix
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip" # Fargate awsvpc tasks register by IP, not instance id

  # 300s is the default and makes every deploy feel broken for five minutes.
  deregistration_delay = 30

  health_check {
    enabled             = true
    path                = var.health_check_path
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  # The target group is referenced by a listener; replace it before destroying.
  lifecycle {
    create_before_destroy = true
  }
}

/* ── HTTP listener ───────────────────────────────────────────────────────────
   With a certificate: permanent redirect to HTTPS.
   Without one: the same 403-unless-verified gate as HTTPS, so the stack can be
   exercised before DNS exists.                                                */
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  dynamic "default_action" {
    for_each = var.certificate_arn == null ? [] : [1]
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  dynamic "default_action" {
    for_each = var.certificate_arn == null ? [1] : []
    content {
      type = "fixed-response"
      fixed_response {
        content_type = "text/plain"
        message_body = "Direct access is not permitted. Requests must arrive via CloudFront."
        status_code  = "403"
      }
    }
  }
}

resource "aws_lb_listener_rule" "http_origin_verified" {
  count = var.certificate_arn == null ? 1 : 0

  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }

  condition {
    http_header {
      http_header_name = "X-Origin-Verify"
      values           = [random_password.origin_verify.result]
    }
  }
}

/* ── HTTPS listener ──────────────────────────────────────────────────────── */
resource "aws_lb_listener" "https" {
  count = var.certificate_arn == null ? 0 : 1

  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Direct access is not permitted. Requests must arrive via CloudFront."
      status_code  = "403"
    }
  }
}

resource "aws_lb_listener_rule" "https_origin_verified" {
  count = var.certificate_arn == null ? 0 : 1

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }

  condition {
    http_header {
      http_header_name = "X-Origin-Verify"
      values           = [random_password.origin_verify.result]
    }
  }
}
