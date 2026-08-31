variable "name_prefix" {
  type = string
}

variable "monthly_limit_usd" {
  type        = number
  description = "Expected monthly spend for this account. Set it near the real figure — a limit set far too high never warns anyone."
}

variable "actual_thresholds_percent" {
  type        = list(number)
  description = "Percentages of the limit that trigger a warning on ACTUAL spend."
  default     = [60, 85, 100]
}

variable "alert_emails" {
  type        = list(string)
  description = "Budget emails need no confirmation click, unlike SNS."
}

variable "enable_anomaly_detection" {
  type        = bool
  description = "Catches a sudden change in spending RATE, which a monthly threshold misses until it is too late."
  default     = true
}

variable "anomaly_threshold_usd" {
  type        = number
  description = "Ignore anomalies smaller than this, or daily noise drowns the signal."
  default     = 10
}
