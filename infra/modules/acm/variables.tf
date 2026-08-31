variable "domain_name" {
  type        = string
  description = "Primary hostname, e.g. origin.vitorra.org."
}

variable "subject_alternative_names" {
  type        = list(string)
  description = "Additional hostnames on the same certificate."
  default     = []
}
