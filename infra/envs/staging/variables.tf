variable "account_id" {
  type        = string
  description = "AWS account this environment is allowed to build in."

  validation {
    condition     = can(regex("^[0-9]{12}$", var.account_id))
    error_message = "account_id must be exactly 12 digits."
  }
}

variable "env" {
  type        = string
  description = "prod or staging."
}

variable "region" {
  type        = string
  description = "Primary region for all regional resources."
  default     = "eu-west-1"
}

variable "alert_emails" {
  type        = list(string)
  description = "Who hears about alarms and budget warnings. Add the junior engineer once he has an account."
  default     = ["john@vitorra.org"]
}
