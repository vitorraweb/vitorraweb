/* ─────────────────────────────────────────────────────────────────────────────
   Monitoring — one dashboard, a handful of alarms, and somewhere for them to go.

   Built to be OWNED by the incoming junior engineer (planning/13-junior-dev-
   onboarding.md, weeks 2–4). Thresholds here are starting points chosen with
   reasons, not truths — the job is to watch them against real traffic and argue
   for better ones.

   ── An alarm nobody tests is a decoration ───────────────────────────────────
   Every alarm below can be fired deliberately with:

       aws cloudwatch set-alarm-state --alarm-name <name> \
         --state-value ALARM --state-reason "testing the path"

   Do that once per alarm and confirm the email actually arrives. An alarm that
   has never fired is a belief, not a monitor.
   ───────────────────────────────────────────────────────────────────────────── */

resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts"

  # Deliberately NOT encrypted with KMS. The VitorraObserver permission set
  # denies kms:GenerateDataKey, so an encrypted topic could not be published to
  # by the person who owns these alarms. Alarm notifications carry a metric name
  # and a threshold — nothing confidential.
}

resource "aws_sns_topic_subscription" "email" {
  for_each = toset(var.alert_emails)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value

  # ⚠ AWS emails each address a confirmation link. Until someone clicks it the
  # subscription stays "PendingConfirmation" and silently receives nothing.
}

locals {
  alarm_actions = [aws_sns_topic.alerts.arn]

  alb_dims = {
    LoadBalancer = var.alb_arn_suffix
  }
  tg_dims = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }
  ecs_dims = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }
}

/* ── 1. The site is down ─────────────────────────────────────────────────────
   The single most important alarm here. HealthyHostCount is a better signal
   than "is a task running" — a container can be running happily while failing
   every health check, which is precisely what happened when Fargate overrode
   HOSTNAME and Next bound to the wrong interface.

   Missing data is treated as BREACHING: no data from a load balancer that
   should always have targets is itself the bad news. */
resource "aws_cloudwatch_metric_alarm" "no_healthy_targets" {
  alarm_name        = "${var.name_prefix}-no-healthy-targets"
  alarm_description = "No healthy containers behind the load balancer. The site is down."

  namespace   = "AWS/ApplicationELB"
  metric_name = "HealthyHostCount"
  dimensions  = local.tg_dims
  statistic   = "Minimum"

  comparison_operator = "LessThanThreshold"
  threshold           = 1
  period              = 60
  evaluation_periods  = 2
  treat_missing_data  = "breaching"

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}

/* ── 2. Errors, as a proportion ──────────────────────────────────────────────
   A raw count is misleading: ten errors out of ten requests is an outage, ten
   out of a hundred thousand is background noise. This is a ratio, and it only
   evaluates when there is traffic to divide by. */
resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name        = "${var.name_prefix}-5xx-error-rate"
  alarm_description = "More than ${var.error_rate_threshold}% of requests are failing with a server error."

  comparison_operator = "GreaterThanThreshold"
  threshold           = var.error_rate_threshold
  evaluation_periods  = 2
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_pct"
    expression  = "IF(requests > 10, 100 * errors / requests, 0)"
    label       = "5xx as % of requests"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      namespace   = "AWS/ApplicationELB"
      metric_name = "HTTPCode_Target_5XX_Count"
      dimensions  = local.tg_dims
      stat        = "Sum"
      period      = 300
    }
  }

  metric_query {
    id = "requests"
    metric {
      namespace   = "AWS/ApplicationELB"
      metric_name = "RequestCount"
      dimensions  = local.tg_dims
      stat        = "Sum"
      period      = 300
    }
  }

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions
}

/* ── 3. The load balancer's own errors ───────────────────────────────────────
   Distinct from the above: these are errors the ALB generated itself, without
   ever reaching a container — no healthy targets, or the target timed out.
   Rare enough that any of them is worth knowing about. */
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name        = "${var.name_prefix}-load-balancer-errors"
  alarm_description = "The load balancer returned errors without reaching a container."

  namespace   = "AWS/ApplicationELB"
  metric_name = "HTTPCode_ELB_5XX_Count"
  dimensions  = local.alb_dims
  statistic   = "Sum"

  comparison_operator = "GreaterThanThreshold"
  threshold           = 5
  period              = 300
  evaluation_periods  = 1
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
}

/* ── 4. Slow ─────────────────────────────────────────────────────────────────
   p95, not average. An average hides the tail, and the tail is what people
   actually complain about. Three seconds is generous for a server-rendered
   page; tighten it once there is a baseline to argue from. */
resource "aws_cloudwatch_metric_alarm" "slow_responses" {
  alarm_name        = "${var.name_prefix}-slow-responses"
  alarm_description = "95th-percentile response time above ${var.response_time_threshold}s."

  namespace          = "AWS/ApplicationELB"
  metric_name        = "TargetResponseTime"
  dimensions         = local.tg_dims
  extended_statistic = "p95"

  comparison_operator = "GreaterThanThreshold"
  threshold           = var.response_time_threshold
  period              = 300
  evaluation_periods  = 2
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
}

/* ── 5. Working too hard ─────────────────────────────────────────────────────
   Matters more than it used to. The container no longer only renders pages —
   every login, form and admin action is proxied through it to the Laravel API
   (see planning/12-aws-migration-plan.md §6b). The task was sized before that
   was true, so this is the alarm most likely to teach us something. */
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name        = "${var.name_prefix}-high-cpu"
  alarm_description = "Container CPU above ${var.cpu_threshold}%. May need a larger task."

  namespace   = "AWS/ECS"
  metric_name = "CPUUtilization"
  dimensions  = local.ecs_dims
  statistic   = "Average"

  comparison_operator = "GreaterThanThreshold"
  threshold           = var.cpu_threshold
  period              = 300
  evaluation_periods  = 2
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name        = "${var.name_prefix}-high-memory"
  alarm_description = "Container memory above ${var.memory_threshold}%. Node will be OOM-killed before this reaches 100."

  namespace   = "AWS/ECS"
  metric_name = "MemoryUtilization"
  dimensions  = local.ecs_dims
  statistic   = "Average"

  comparison_operator = "GreaterThanThreshold"
  threshold           = var.memory_threshold
  period              = 300
  evaluation_periods  = 2
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
}

/* ── The dashboard ───────────────────────────────────────────────────────────
   One screen, read top to bottom: is it up, is it erroring, is it slow, is it
   struggling. Deliberately small — a dashboard with forty widgets is one nobody
   looks at. */
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = var.name_prefix

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "text", x = 0, y = 0, width = 24, height = 2
        properties = {
          markdown = "# ${var.name_prefix}\nIs it up → is it erroring → is it slow → is it struggling. Alarms go to **${var.name_prefix}-alerts**."
        }
      },
      {
        type = "metric", x = 0, y = 2, width = 8, height = 6
        properties = {
          title  = "Healthy containers (0 = the site is down)"
          region = var.region
          view   = "timeSeries"
          stat   = "Minimum"
          period = 60
          yAxis  = { left = { min = 0 } }
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", var.target_group_arn_suffix, "LoadBalancer", var.alb_arn_suffix, { label = "healthy" }],
            [".", "UnHealthyHostCount", ".", ".", ".", ".", { label = "unhealthy" }],
          ]
        }
      },
      {
        type = "metric", x = 8, y = 2, width = 8, height = 6
        properties = {
          title  = "Requests and errors"
          region = var.region
          view   = "timeSeries"
          stat   = "Sum"
          period = 300
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "TargetGroup", var.target_group_arn_suffix, "LoadBalancer", var.alb_arn_suffix, { label = "requests" }],
            [".", "HTTPCode_Target_5XX_Count", ".", ".", ".", ".", { label = "5xx from the app", color = "#d62728" }],
            [".", "HTTPCode_Target_4XX_Count", ".", ".", ".", ".", { label = "4xx", color = "#ff7f0e" }],
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { label = "5xx from the balancer", color = "#8c564b" }],
          ]
        }
      },
      {
        type = "metric", x = 16, y = 2, width = 8, height = 6
        properties = {
          title  = "Response time (p50 / p95 / p99)"
          region = var.region
          view   = "timeSeries"
          period = 300
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "TargetGroup", var.target_group_arn_suffix, "LoadBalancer", var.alb_arn_suffix, { stat = "p50", label = "p50" }],
            ["...", { stat = "p95", label = "p95" }],
            ["...", { stat = "p99", label = "p99" }],
          ]
        }
      },
      {
        type = "metric", x = 0, y = 8, width = 12, height = 6
        properties = {
          title  = "Container CPU and memory (the API proxy runs through here too)"
          region = var.region
          view   = "timeSeries"
          stat   = "Average"
          period = 300
          yAxis  = { left = { min = 0, max = 100 } }
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_service_name, { label = "CPU %" }],
            [".", "MemoryUtilization", ".", ".", ".", ".", { label = "Memory %" }],
          ]
          annotations = {
            horizontal = [
              { label = "CPU alarm", value = var.cpu_threshold, color = "#d62728" },
              { label = "Memory alarm", value = var.memory_threshold, color = "#ff7f0e" },
            ]
          }
        }
      },
      {
        type = "metric", x = 12, y = 8, width = 12, height = 6
        properties = {
          title  = "Recent errors in the container log"
          region = var.region
          view   = "timeSeries"
          stat   = "Sum"
          period = 300
          metrics = [
            ["AWS/ApplicationELB", "TargetConnectionErrorCount", "TargetGroup", var.target_group_arn_suffix, "LoadBalancer", var.alb_arn_suffix, { label = "connection errors" }],
            [".", "RequestCountPerTarget", ".", ".", ".", ".", { label = "requests per container", stat = "Sum" }],
          ]
        }
      },
    ]
  })
}
