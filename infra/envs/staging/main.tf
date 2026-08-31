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

  # Deliberately empty. See the variable's own documentation before adding to it.
  alb_ingress_extra_cidrs = []
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
