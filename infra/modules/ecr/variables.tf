variable "name" {
  type        = string
  description = "Repository name, e.g. vitorra-frontend."
}

variable "keep_last_n_images" {
  type        = number
  description = <<-EOT
    How many images to retain. Must comfortably exceed the number of deploys you
    might need to roll back across — an expired image cannot be rolled back to.
  EOT
  default     = 10
}

variable "untagged_expire_days" {
  type        = number
  description = "Days to keep untagged layers. These are build leftovers nothing references."
  default     = 1
}
