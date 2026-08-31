/* ─────────────────────────────────────────────────────────────────────────────
   AWS WAF — attached to CloudFront.

   Must be created in us-east-1 with scope = CLOUDFRONT, wherever else the stack
   lives. Instantiate with providers = { aws = aws.us_east_1 }.

   ── Rule order matters ──────────────────────────────────────────────────────
   Rules evaluate by priority, lowest first, and the first terminating action
   wins. The allow-list sits at priority 0 so our own backend can never be
   throttled by the rate limit below it.

   ── On starting in COUNT mode ───────────────────────────────────────────────
   Managed rule groups block real attacks and also, occasionally, real
   customers. Every rule here can be set to count-only, which logs what WOULD
   have been blocked without blocking it. Run a few days in count mode, read the
   logs, then switch to blocking — turning it all on at once and discovering a
   week later that the enquiry form was 403ing is the classic way to do this
   badly.
   ───────────────────────────────────────────────────────────────────────────── */

resource "aws_wafv2_ip_set" "trusted" {
  name               = "${var.name_prefix}-trusted"
  description        = "Never rate-limited: our own backend calling /api/revalidate."
  scope              = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses          = var.trusted_ips
}

resource "aws_wafv2_web_acl" "this" {
  name        = var.name_prefix
  description = "Rate limiting and AWS managed rule groups for the Vitorra frontend."
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  /* Priority 0 — our own infrastructure, exempt from everything below.
     The Laravel backend posts to /api/revalidate from a single Namecheap
     address after every blog publish. A rate limit that catches it would make
     publishing silently stop working. Gotcha #10 in the migration plan. */
  rule {
    name     = "allow-trusted-ips"
    priority = 0

    action {
      allow {}
    }

    statement {
      ip_set_reference_statement {
        arn = aws_wafv2_ip_set.trusted.arn
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-trusted"
      sampled_requests_enabled   = true
    }
  }

  /* Priority 1 — blunt volumetric limit. Counts requests per IP over a rolling
     five minutes. Generous on purpose: this is here to stop scraping and
     credential stuffing, not to police normal browsing. A page load pulls many
     assets, though most are served from cache and never reach here. */
  rule {
    name     = "rate-limit"
    priority = 1

    action {
      dynamic "block" {
        for_each = var.count_only ? [] : [1]
        content {}
      }
      dynamic "count" {
        for_each = var.count_only ? [1] : []
        content {}
      }
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.name_prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  /* Priorities 10+ — AWS managed rule groups. */
  dynamic "rule" {
    for_each = { for i, g in var.managed_rule_groups : g => i }

    content {
      name     = rule.key
      priority = 10 + rule.value

      override_action {
        dynamic "none" {
          for_each = var.count_only ? [] : [1]
          content {}
        }
        dynamic "count" {
          for_each = var.count_only ? [1] : []
          content {}
        }
      }

      statement {
        managed_rule_group_statement {
          name        = rule.key
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.name_prefix}-${rule.key}"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = var.name_prefix
    sampled_requests_enabled   = true
  }
}
