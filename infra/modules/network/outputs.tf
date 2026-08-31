output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value       = [for s in aws_subnet.public : s.id]
  description = "Used by the load balancer and the ECS service."
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "tasks_security_group_id" {
  value = aws_security_group.tasks.id
}

output "availability_zones" {
  value = [for s in aws_subnet.public : s.availability_zone]
}
