/* prod environment — account 574247905057, region eu-west-1.

   Module calls land here as each is built (see planning/11-aws-migration-plan.md
   Phase 2). Read this file top to bottom to understand what this environment is. */

data "aws_caller_identity" "current" {}

output "account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "Sanity check — should match var.account_id."
}
