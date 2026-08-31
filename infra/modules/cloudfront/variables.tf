variable "name_prefix" {
  type = string
}

variable "domain_name" {
  type        = string
  description = "Public hostname, e.g. staging.vitorra.org or www.vitorra.org."
}

variable "origin_domain_name" {
  type        = string
  description = "The load balancer's origin hostname. Must match its certificate."
}

variable "origin_verify_secret" {
  type        = string
  sensitive   = true
  description = "Sent as X-Origin-Verify; the load balancer 403s anything without it."
}

variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN. MUST be in us-east-1 — CloudFront rejects any other region."
}

variable "web_acl_arn" {
  type        = string
  description = "WAF web ACL, also us-east-1 with CLOUDFRONT scope. Null to attach none."
  default     = null
}

variable "static_path_patterns" {
  type        = list(string)
  description = "Paths under public/ safe to cache hard."
  default     = ["/downloads/*", "/team/*", "/hero/*", "/products/*", "/videos/*", "/press/*"]
}
