/* ─────────────────────────────────────────────────────────────────────────────
   Cost alerts.

   The whole point of moving off a flat monthly fee was to see what we actually
   spend. That only works if someone is told before the number is a surprise, so
   this alerts on the way up rather than reporting after the fact.

   Two kinds of warning, because they catch different things:

     • Thresholds — "we are on track to spend more than planned this month."
       Predictable overspend, caught early.
     • Forecast   — the same, but on AWS's projection rather than the actual, so
       a bad first week is flagged before the month ends.

   Budgets are a global service; the resource lives in whichever region the
   provider points at, which does not matter.
   ───────────────────────────────────────────────────────────────────────────── */

resource "aws_budgets_budget" "monthly" {
  name         = "${var.name_prefix}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  # Credits and refunds are excluded so the alert reflects what the account
  # genuinely costs to run, not what it happens to be charged while free-tier
  # credits last. Otherwise the first real bill arrives with no warning at all.
  cost_types {
    include_credit             = false
    include_refund             = false
    include_discount           = true
    include_other_subscription = true
    include_recurring          = true
    include_subscription       = true
    include_support            = true
    include_tax                = true
    include_upfront            = true
    use_amortized              = false
    use_blended                = false
  }

  dynamic "notification" {
    for_each = var.actual_thresholds_percent

    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = var.alert_emails
    }
  }

  # One forecast warning. More than one and they become noise people filter.
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.alert_emails
  }
}

/* Catches the shape a threshold cannot: a sudden change in the RATE of spend.
   A forgotten NAT gateway or a runaway task shows up here days before it
   crosses a monthly limit. AWS learns the normal pattern itself. */
resource "aws_ce_anomaly_monitor" "services" {
  count = var.enable_anomaly_detection ? 1 : 0

  name              = "${var.name_prefix}-anomalies"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "alerts" {
  count = var.enable_anomaly_detection ? 1 : 0

  name             = "${var.name_prefix}-anomaly-alerts"
  frequency        = "DAILY"
  monitor_arn_list = [aws_ce_anomaly_monitor.services[0].arn]

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      match_options = ["GREATER_THAN_OR_EQUAL"]
      values        = [tostring(var.anomaly_threshold_usd)]
    }
  }

  dynamic "subscriber" {
    for_each = var.alert_emails

    content {
      type    = "EMAIL"
      address = subscriber.value
    }
  }
}
