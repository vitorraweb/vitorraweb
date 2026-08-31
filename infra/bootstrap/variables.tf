variable "account_id" {
  type        = string
  description = "The 12-digit AWS account id this is allowed to run against."

  validation {
    condition     = can(regex("^[0-9]{12}$", var.account_id))
    error_message = "account_id must be exactly 12 digits."
  }
}

variable "env" {
  type        = string
  description = "prod or staging."

  validation {
    condition     = contains(["prod", "staging"], var.env)
    error_message = "env must be prod or staging."
  }
}

variable "region" {
  type        = string
  description = "Region the state bucket lives in."
  default     = "eu-west-1"
}
