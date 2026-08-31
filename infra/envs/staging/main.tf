/* staging environment — account 950177940799, region eu-west-1.

   Read top to bottom to understand what this environment is. Modules are added
   here as each is built (planning/11-aws-migration-plan.md, Phase 2). */

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "vitorra-${var.env}"
}

module "network" {
  source = "../../modules/network"

  name_prefix    = local.name_prefix
  vpc_cidr       = "10.10.0.0/16"
  container_port = 3000

  # TEMPORARY — John's address, so the load balancer can be verified before
  # CloudFront exists in front of it. Remove once CloudFront is live.
  alb_ingress_extra_cidrs = ["41.210.157.214/32"]
}

module "ecr" {
  source = "../../modules/ecr"

  name = "vitorra-frontend"

  # Ten deploys of headroom to roll back across. Images are ~470MB, so this caps
  # storage at roughly $0.50/month.
  keep_last_n_images = 10
}

module "alb" {
  source = "../../modules/alb"

  name_prefix       = local.name_prefix
  vpc_id            = module.network.vpc_id
  subnet_ids        = module.network.public_subnet_ids
  security_group_id = module.network.alb_security_group_id
  container_port    = 3000

  # No certificate yet — needs origin.vitorra.org and DNS validation at GoDaddy.
  # Until then the listener serves HTTP so the stack can be verified end to end.
  certificate_arn     = null
  deletion_protection = false
}

output "account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "Sanity check — should match var.account_id."
}

output "vpc_id" {
  value = module.network.vpc_id
}

output "public_subnet_ids" {
  value = module.network.public_subnet_ids
}

output "ecr_repository_url" {
  value = module.ecr.repository_url
}

output "alb_dns_name" {
  value = module.alb.dns_name
}

output "origin_verify_secret_arn" {
  value       = module.alb.origin_verify_secret_arn
  description = "Read the value with: aws secretsmanager get-secret-value --secret-id <arn>"
}
