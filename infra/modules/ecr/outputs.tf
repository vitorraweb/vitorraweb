output "repository_url" {
  value       = aws_ecr_repository.this.repository_url
  description = "Push target, e.g. 123456789012.dkr.ecr.eu-west-1.amazonaws.com/vitorra-frontend"
}

output "repository_arn" {
  value = aws_ecr_repository.this.arn
}

output "repository_name" {
  value = aws_ecr_repository.this.name
}
