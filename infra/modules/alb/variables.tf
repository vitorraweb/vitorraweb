variable "name_prefix" {
  type        = string
  description = "Prefix for resource names, e.g. vitorra-staging."
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type        = list(string)
  description = "Public subnets, at least two availability zones."
}

variable "security_group_id" {
  type        = string
  description = "The ALB security group from the network module."
}

variable "container_port" {
  type    = number
  default = 3000
}

variable "health_check_path" {
  type        = string
  description = "Must not touch the Laravel API — see frontend/src/app/api/health/route.ts."
  default     = "/api/health"
}

variable "certificate_arn" {
  type        = string
  description = <<-EOT
    ACM certificate for the origin hostname, in THIS region (not us-east-1 —
    that one is for CloudFront). Null until origin.vitorra.org exists, in which
    case the listener serves HTTP so the stack can be verified.
  EOT
  default     = null
}

variable "deletion_protection" {
  type        = bool
  description = "True in production."
  default     = false
}
