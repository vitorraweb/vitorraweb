variable "name_prefix" {
  type        = string
  description = "Prefix for resource names, e.g. vitorra-staging."
}

variable "vpc_cidr" {
  type        = string
  description = "Address range for the VPC. A /16 leaves room for private subnets later."
  default     = "10.0.0.0/16"
}

variable "az_count" {
  type        = number
  description = "Availability zones to spread across. Two is the minimum an ALB accepts."
  default     = 2

  validation {
    condition     = var.az_count >= 2
    error_message = "An Application Load Balancer requires at least two availability zones."
  }
}

variable "container_port" {
  type        = number
  description = "Port the Next.js container listens on."
  default     = 3000
}

variable "alb_ingress_extra_cidrs" {
  type        = list(string)
  description = <<-EOT
    Extra CIDRs allowed to reach the load balancer directly, bypassing CloudFront.
    Intended only for testing the ALB before CloudFront exists. Leave empty in
    production — a stray /0 here silently disables the WAF for anyone who finds
    the load balancer's hostname.
  EOT
  default     = []
}
