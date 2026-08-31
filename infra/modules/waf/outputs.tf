output "web_acl_arn" {
  value       = aws_wafv2_web_acl.this.arn
  description = "Attach to a CloudFront distribution via web_acl_id."
}

output "web_acl_name" {
  value = aws_wafv2_web_acl.this.name
}
