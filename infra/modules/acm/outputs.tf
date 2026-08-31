output "arn" {
  value = aws_acm_certificate.this.arn
}

output "domain_name" {
  value = aws_acm_certificate.this.domain_name
}

output "status" {
  value = aws_acm_certificate.this.status
}

output "validation_records" {
  description = "CNAMEs to create at GoDaddy. Leave them in place permanently — renewal re-checks them."
  value = [
    for o in aws_acm_certificate.this.domain_validation_options : {
      for_domain = o.domain_name
      name       = o.resource_record_name
      type       = o.resource_record_type
      value      = o.resource_record_value
    }
  ]
}
