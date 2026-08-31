output "dns_name" {
  value       = aws_lb.this.dns_name
  description = "CNAME target for the origin hostname."
}

output "zone_id" {
  value = aws_lb.this.zone_id
}

output "arn" {
  value = aws_lb.this.arn
}

output "arn_suffix" {
  value       = aws_lb.this.arn_suffix
  description = "Used by CloudWatch alarms for ALB metrics."
}

output "target_group_arn" {
  value = aws_lb_target_group.this.arn
}

output "origin_verify_secret" {
  value       = random_password.origin_verify.result
  sensitive   = true
  description = "CloudFront must send this as the X-Origin-Verify header."
}

output "origin_verify_secret_arn" {
  value       = aws_secretsmanager_secret.origin_verify.arn
  description = "Where a human can retrieve it without reading state."
}
