variable "name_prefix" {
  type = string
}

variable "rate_limit" {
  type        = number
  description = "Requests per IP per rolling 5 minutes before the rate rule fires. AWS minimum is 100."
  default     = 2000
}

variable "trusted_ips" {
  type        = list(string)
  description = <<-EOT
    CIDRs exempt from every rule — principally the Laravel backend, which posts
    to /api/revalidate from one address. An empty list is not allowed by AWS, so
    a harmless placeholder is used when there is nothing to trust yet.
  EOT
  default     = ["192.0.2.1/32"] # TEST-NET-1, reserved for documentation
}

variable "managed_rule_groups" {
  type        = list(string)
  description = "AWS managed rule group names, applied in listed order from priority 10."
  default = [
    "AWSManagedRulesAmazonIpReputationList",
    "AWSManagedRulesCommonRuleSet",
    "AWSManagedRulesKnownBadInputsRuleSet",
  ]
}

variable "count_only" {
  type        = bool
  description = <<-EOT
    True logs what WOULD be blocked without blocking it. Start here, read the
    CloudWatch metrics for a few days, then switch to false. Turning everything
    on at once is how you discover a week later that the enquiry form was 403ing.
  EOT
  default     = true
}
