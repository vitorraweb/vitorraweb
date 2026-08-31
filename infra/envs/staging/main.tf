/* staging environment — account 950177940799, region eu-west-1.

   Read top to bottom to understand what this environment is. Modules are added
   here as each is built (planning/12-aws-migration-plan.md, Phase 2). */

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

  # staging-origin.vitorra.org, validated by DNS at GoDaddy. With this set, the
  # HTTPS listener carries the origin-verify gate and HTTP becomes a permanent
  # redirect to it.
  certificate_arn     = module.cert_origin.arn
  deletion_protection = false
}

/* The shared secret the Laravel backend sends when it calls /api/revalidate
   after a blog post is published. Terraform creates the secret but deliberately
   does NOT own its value — the real value already exists on the Namecheap box
   as FRONTEND_REVALIDATE_SECRET, and the two must match exactly.

   Set it once, by hand, and Terraform will leave it alone thereafter:
     aws secretsmanager put-secret-value \
       --secret-id vitorra-staging/revalidate-secret \
       --secret-string '<the value from backend/.env>' --profile vitorra-staging  */
resource "aws_secretsmanager_secret" "revalidate" {
  name                    = "${local.name_prefix}/revalidate-secret"
  description             = "Must match FRONTEND_REVALIDATE_SECRET in the Laravel backend."
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "revalidate" {
  secret_id     = aws_secretsmanager_secret.revalidate.id
  secret_string = "PLACEHOLDER-set-me-by-hand"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

module "ecs" {
  source = "../../modules/ecs"

  name_prefix = local.name_prefix
  region      = var.region

  repository_url = module.ecr.repository_url
  image_tag      = "2ef5de2"

  subnet_ids        = module.network.public_subnet_ids
  security_group_id = module.network.tasks_security_group_id
  target_group_arn  = module.alb.target_group_arn
  container_port    = 3000

  cpu           = 512
  memory        = 1024
  desired_count = 1

  secret_arns = {
    REVALIDATE_SECRET = aws_secretsmanager_secret.revalidate.arn
  }

  # Staging is where we debug, so allow shelling into a running task.
  enable_execute_command = true
  container_insights     = false
  log_retention_days     = 14
}

/* Certificate for the load balancer's origin hostname. Regional — must be in
   the same region as the ALB. */
module "cert_origin" {
  source      = "../../modules/acm"
  domain_name = "staging-origin.vitorra.org"
}

/* Certificate for the public hostname CloudFront serves. MUST be us-east-1;
   CloudFront rejects certificates from anywhere else. */
module "cert_public" {
  source      = "../../modules/acm"
  domain_name = "staging.vitorra.org"

  providers = {
    aws = aws.us_east_1
  }
}

module "waf" {
  source = "../../modules/waf"

  name_prefix = local.name_prefix

  # Start in count-only mode: log what WOULD be blocked, block nothing. Read the
  # CloudWatch metrics for a few days, then flip to false.
  count_only = true
  rate_limit = 2000

  providers = {
    aws = aws.us_east_1
  }
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  name_prefix          = local.name_prefix
  domain_name          = "staging.vitorra.org"
  origin_domain_name   = "staging-origin.vitorra.org"
  origin_verify_secret = module.alb.origin_verify_secret
  certificate_arn      = module.cert_public.arn
  web_acl_arn          = module.waf.web_acl_arn
}

module "github_deploy" {
  source = "../../modules/github-oidc"

  name_prefix = local.name_prefix

  # Pinned to one repository and one branch. A wildcard here would let any pull
  # request from any fork deploy — the module's validation rejects that.
  allowed_subjects = ["repo:vitorraweb/vitorraweb:ref:refs/heads/master"]

  ecr_repository_arn = module.ecr.repository_arn
  ecs_service_arn    = module.ecs.service_arn
  passable_role_arns = [
    module.ecs.execution_role_arn,
    module.ecs.task_role_arn,
  ]
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

output "cloudfront_domain" {
  value       = module.cloudfront.domain_name
  description = "CNAME target for staging.vitorra.org at GoDaddy."
}

output "dns_records_to_add" {
  description = "Add these at GoDaddy. Validation records are permanent — renewal re-checks them."
  value = {
    origin_cert_validation = module.cert_origin.validation_records
    public_cert_validation = module.cert_public.validation_records
  }
}

output "cert_origin_arn" {
  value = module.cert_origin.arn
}

output "cert_public_arn" {
  value = module.cert_public.arn
}

output "ecr_repository_url" {
  value = module.ecr.repository_url
}

output "alb_dns_name" {
  value = module.alb.dns_name
}

output "github_deploy_role_arn" {
  value       = module.github_deploy.role_arn
  description = "role-to-assume for aws-actions/configure-aws-credentials."
}

output "ecs_cluster" {
  value = module.ecs.cluster_name
}

output "ecs_service" {
  value = module.ecs.service_name
}

output "log_group" {
  value = module.ecs.log_group_name
}

output "origin_verify_secret_arn" {
  value       = module.alb.origin_verify_secret_arn
  description = "Read the value with: aws secretsmanager get-secret-value --secret-id <arn>"
}
