variable "name_prefix" {
  type = string
}

variable "region" {
  type = string
}

variable "alert_emails" {
  type        = list(string)
  description = <<-EOT
    Where alarms go. Each address is emailed a confirmation link by AWS and
    receives NOTHING until someone clicks it — check the subscription shows
    "Confirmed", not "PendingConfirmation".
  EOT
  default     = []
}

variable "alb_arn_suffix" {
  type = string
}

variable "target_group_arn_suffix" {
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "ecs_service_name" {
  type = string
}

variable "error_rate_threshold" {
  type        = number
  description = "Percent of requests failing with 5xx before alarming. Starting point, not gospel."
  default     = 1
}

variable "response_time_threshold" {
  type        = number
  description = "p95 seconds. Generous for server-rendered pages; tighten once there is a baseline."
  default     = 3
}

variable "cpu_threshold" {
  type    = number
  default = 80
}

variable "memory_threshold" {
  type        = number
  description = "Node is OOM-killed well before 100%, so alarm with room to act."
  default     = 85
}
