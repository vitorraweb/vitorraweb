/* prod environment — account 574247905057, region eu-west-1.
   THE LIVE SITE. Changes here go through a reviewed pull request.

   Read top to bottom to understand what this environment is. Modules are added
   here as each is built (planning/12-aws-migration-plan.md, Phase 2). */

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "vitorra-${var.env}"
}

module "network" {
  source = "../../modules/network"

  name_prefix = local.name_prefix

  # Deliberately does not overlap staging's 10.10.0.0/16. Costs nothing now and
  # is the difference between being able to peer the two VPCs later and not.
  vpc_cidr       = "10.0.0.0/16"
  container_port = 3000

  # MUST stay empty in production. Anything here bypasses CloudFront, and with
  # it the WAF and rate limiting. Read the variable's documentation first.
  alb_ingress_extra_cidrs = []
}

module "ecr" {
  source = "../../modules/ecr"

  name = "vitorra-frontend"

  # Ten deploys of headroom to roll back across. Images are ~470MB, so this caps
  # storage at roughly $0.50/month.
  keep_last_n_images = 10
}

/* Certificate for the load balancer's origin hostname. Regional — must be in
   the same region as the ALB. */
module "cert_origin" {
  source      = "../../modules/acm"
  domain_name = "origin.vitorra.org"
}

/* Certificate for the public hostname CloudFront serves. MUST be us-east-1;
   CloudFront rejects certificates from anywhere else. */
module "cert_public" {
  source      = "../../modules/acm"
  domain_name = "www.vitorra.org"

  providers = {
    aws = aws.us_east_1
  }
}

module "alb" {
  source = "../../modules/alb"

  name_prefix       = local.name_prefix
  vpc_id            = module.network.vpc_id
  subnet_ids        = module.network.public_subnet_ids
  security_group_id = module.network.alb_security_group_id
  container_port    = 3000

  certificate_arn = module.cert_origin.arn

  # Production. Deleting this should require removing the protection first.
  deletion_protection = true
}

/* Shared secret the Laravel backend sends when calling /api/revalidate after a
   blog post is published. Terraform creates the secret but deliberately does
   NOT own its value — the real one already exists on the Namecheap box as
   FRONTEND_REVALIDATE_SECRET, and the two must match exactly or published posts
   silently take up to thirty minutes to appear.

   Set it once, by hand, before cutover:
     aws secretsmanager put-secret-value \
       --secret-id vitorra-prod/revalidate-secret \
       --secret-string '<value from backend/.env>' --profile vitorra-prod       */
resource "aws_secretsmanager_secret" "revalidate" {
  name                    = "${local.name_prefix}/revalidate-secret"
  description             = "Must match FRONTEND_REVALIDATE_SECRET in the Laravel backend."
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "revalidate" {
  secret_id     = aws_secretsmanager_secret.revalidate.id
  secret_string = "PLACEHOLDER-set-me-before-cutover"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

module "ecs" {
  source = "../../modules/ecs"

  name_prefix = local.name_prefix
  region      = var.region

  repository_url = module.ecr.repository_url
  image_tag      = "407a781"

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

  # Production: no shelling into live containers, and keep per-container metrics
  # so the junior engineer's dashboards have something to show.
  enable_execute_command = false
  container_insights     = true
  log_retention_days     = 30
}

/* ─────────────────────────────────────────────────────────────────────────────
   The CDN, and the firewall that only exists once there is a CloudFront to
   attach it to.

   Creating these changes nothing for customers. Every visitor keeps reaching
   Vercel until `CNAME www` at GoDaddy is repointed at the distribution below —
   that repoint IS the cutover (§9 of planning/12-aws-migration-plan.md).
   ───────────────────────────────────────────────────────────────────────────── */

module "waf" {
  source = "../../modules/waf"

  name_prefix = local.name_prefix

  # Report-only on purpose, and it must stay that way until after cutover. A
  # managed rule group that 403s the enquiry form is worse than no firewall at
  # all, and which rules misfire on our traffic is not knowable until our
  # traffic has run through them. Read the CloudWatch counts for a few days,
  # then set this to false — item E of the pending list in PROGRESS.md.
  count_only = true
  rate_limit = 2000

  # The Laravel backend POSTs to /api/revalidate from the Namecheap box after
  # every blog publish — this is the A record of api.vitorra.org. Rate-limiting
  # it is how blog publishing silently stops working, which is exactly the
  # failure we just spent August finding and fixing. Gotcha #10 in the plan.
  trusted_ips = ["192.64.118.27/32"]

  providers = {
    aws = aws.us_east_1
  }
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  name_prefix          = local.name_prefix
  domain_name          = "www.vitorra.org"
  origin_domain_name   = "origin.vitorra.org"
  origin_verify_secret = module.alb.origin_verify_secret
  certificate_arn      = module.cert_public.arn
  web_acl_arn          = module.waf.web_acl_arn
}

module "github_deploy" {
  source = "../../modules/github-oidc"

  name_prefix = local.name_prefix

  /* Pinned to the production ENVIRONMENT, not to a branch.

     This is not interchangeable with the ref form. A job that declares
     `environment: production` gets a different OIDC subject claim from GitHub:

         no environment  →  repo:vitorraweb/vitorraweb:ref:refs/heads/master
         environment set →  repo:vitorraweb/vitorraweb:environment:production

     Pinning the ref while the workflow declares an environment fails with
     "Not authorized to perform sts:AssumeRoleWithWebIdentity", which reads like
     a broken trust policy rather than a mismatched claim.

     The environment form is also stricter: only a job running in the
     approval-gated production environment can assume this role, whatever
     branch it came from. */
  allowed_subjects = ["repo:vitorraweb/vitorraweb:environment:production"]

  ecr_repository_arn = module.ecr.repository_arn
  ecs_service_arn    = module.ecs.service_arn
  passable_role_arns = [
    module.ecs.execution_role_arn,
    module.ecs.task_role_arn,
  ]
}

module "monitoring" {
  source = "../../modules/monitoring"

  name_prefix = local.name_prefix
  region      = var.region

  # ⚠ Each address gets a confirmation email from AWS and receives nothing until
  # the link is clicked. Check the subscription reads "Confirmed".
  alert_emails = var.alert_emails

  alb_arn_suffix          = module.alb.arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix
  ecs_cluster_name        = module.ecs.cluster_name
  ecs_service_name        = module.ecs.service_name
}

module "budget" {
  source = "../../modules/budget"

  name_prefix       = local.name_prefix
  monthly_limit_usd = 60
  alert_emails      = var.alert_emails
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

output "github_deploy_role_arn" {
  value       = module.github_deploy.role_arn
  description = "role-to-assume for aws-actions/configure-aws-credentials."
}

output "cloudfront_domain" {
  value       = module.cloudfront.domain_name
  description = "CNAME target for www.vitorra.org at GoDaddy. ⚠ Pointing it here IS the cutover."
}

output "cloudfront_distribution_id" {
  value       = module.cloudfront.distribution_id
  description = "aws cloudfront create-invalidation --distribution-id <this> --paths '/*'"
}

output "alerts_topic_arn" {
  value = module.monitoring.sns_topic_arn
}

output "alarm_names" {
  description = "Fire each once with `aws cloudwatch set-alarm-state` and confirm the email arrives."
  value       = module.monitoring.alarm_names
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

output "alb_dns_name" {
  value       = module.alb.dns_name
  description = "CNAME target for origin.vitorra.org at GoDaddy."
}

output "origin_verify_secret_arn" {
  value = module.alb.origin_verify_secret_arn
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
