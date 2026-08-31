variable "name_prefix" {
  type = string
}

variable "allowed_subjects" {
  type        = list(string)
  description = <<-EOT
    GitHub OIDC `sub` claims permitted to assume this role. Pin to exact refs.
    NEVER use "repo:org/repo:*" — that lets any branch, and any pull request
    from any fork, deploy.
  EOT

  validation {
    condition     = alltrue([for s in var.allowed_subjects : !endswith(s, ":*")])
    error_message = "A wildcard subject would let any branch or fork PR assume this role. Pin to an exact ref or environment."
  }
}

variable "create_oidc_provider" {
  type        = bool
  description = "False if the account already has the GitHub OIDC provider — there can only be one per account."
  default     = true
}

variable "existing_oidc_provider_arn" {
  type    = string
  default = null
}

variable "ecr_repository_arn" {
  type = string
}

variable "ecs_service_arn" {
  type = string
}

variable "passable_role_arns" {
  type        = list(string)
  description = "The ECS execution and task role ARNs, and nothing else."
}
