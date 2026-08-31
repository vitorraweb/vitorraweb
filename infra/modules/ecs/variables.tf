variable "name_prefix" {
  type = string
}

variable "region" {
  type        = string
  description = "Needed explicitly for the awslogs driver."
}

variable "repository_url" {
  type        = string
  description = "ECR repository URL from the ecr module."
}

variable "image_tag" {
  type        = string
  description = <<-EOT
    Git SHA of the image to run. Terraform only sets this for the FIRST task
    definition; CI registers every revision after that, and the service ignores
    changes to task_definition. Changing this value here will not redeploy.
  EOT
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  type        = string
  description = "The tasks security group — reachable only from the load balancer."
}

variable "target_group_arn" {
  type = string
}

variable "container_port" {
  type    = number
  default = 3000
}

variable "cpu" {
  type        = number
  description = "CPU units. 512 = 0.5 vCPU."
  default     = 512
}

variable "memory" {
  type        = number
  description = "MiB. Must be a valid pairing with cpu — 512 CPU allows 1024-4096."
  default     = 1024
}

variable "desired_count" {
  type        = number
  description = <<-EOT
    Number of tasks. MUST stay at 1 until a shared ISR cache handler exists —
    see the module header. Raising this alone causes blog posts to appear on
    some containers and not others, at random, for up to thirty minutes.
  EOT
  default     = 1

  validation {
    condition     = var.desired_count == 1
    error_message = "desired_count above 1 requires a shared ISR cache handler first. Read the header in modules/ecs/main.tf, then relax this validation deliberately."
  }
}

variable "environment" {
  type        = map(string)
  description = "Plain environment variables. NEXT_PUBLIC_* do NOT belong here — they are compiled into the bundle at build time."
  default     = {}
}

variable "secret_arns" {
  type        = map(string)
  description = "Env var name → Secrets Manager ARN. Injected by the ECS agent, never visible in the task definition."
  default     = {}
}

variable "log_retention_days" {
  type        = number
  description = "CloudWatch logs never expire by default and are billed for storage."
  default     = 30
}

variable "enable_execute_command" {
  type        = bool
  description = "Allows `aws ecs execute-command` to open a shell in a running task. Useful on staging, a real audit consideration in production."
  default     = false
}

variable "container_insights" {
  type        = bool
  description = "Per-container CPU/memory metrics. Costs extra; worth it in production."
  default     = false
}
