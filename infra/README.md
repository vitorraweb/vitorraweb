# infra — Vitorra infrastructure as code

Everything AWS runs is defined here. Nothing is created by clicking in the console;
if it exists in AWS and is not in this directory, treat it as a mistake to fix.

Built with **OpenTofu**, not HashiCorp Terraform. It is a drop-in replacement —
identical language, identical providers, identical state format. Every Terraform
tutorial applies; you type `tofu` where the docs say `terraform`.

> Why: `brew install terraform` no longer works (HashiCorp pulled it from
> homebrew-core when the licence changed to BUSL in 2023), and installing from
> their tap is blocked on this machine by outdated Xcode Command Line Tools.
> OpenTofu is MPL-licensed, which also removes a licence question for the company.

## Layout

```
infra/
├── bootstrap/     Creates the S3 state bucket. Run once per account. Local state.
├── iam/           Permission sets (VitorraObserver). See iam/README.md.
├── modules/       Reusable building blocks — network, ecr, alb, ecs, cloudfront, waf.
└── envs/
    ├── prod/      vitorra-prod    — the live site
    └── staging/   vitorra-staging — where the junior engineer can break things
```

Each environment is a **separate directory with its own state**, targeting a
**separate AWS account**. That is deliberate: there is no workspace to forget to
switch, and no way to apply production config to staging by accident.

## First run, per account

```bash
# 1. Sign in (short-lived credentials, no access keys on disk)
aws sso login --profile vitorra-prod

# 2. Create the state bucket.
#    -state is REQUIRED: one directory bootstraps both accounts, and the default
#    filename would make the second run try to replace the first one's bucket.
cd infra/bootstrap
tofu init
AWS_PROFILE=vitorra-prod tofu apply \
  -state=terraform-prod.tfstate \
  -var-file=../envs/prod/bootstrap.tfvars

# 3. Then the environment itself
cd ../envs/prod
tofu init
AWS_PROFILE=vitorra-prod tofu plan
```

## Rules

- **Production applies go through a reviewed pull request**, never from a laptop.
  Paste the `tofu plan` output into the PR description.
- **Never commit state or a saved plan.** Both are plaintext and can contain
  secrets. `.gitignore` covers this; do not add exceptions.
- **`.terraform.lock.hcl` IS committed** so everyone and CI resolve identical
  provider builds.
- **`allowed_account_ids` is set on every provider.** If your `AWS_PROFILE` is
  stale, tofu refuses to run rather than quietly building in the wrong account.
- Secrets live in **AWS Secrets Manager**, referenced by ARN. Never in a `.tfvars`.

## Reading order, if this is new to you

`bootstrap/main.tf` is the smallest complete example — one bucket, with the
reasoning for each setting written next to it. Start there, then
`modules/network`, then follow an environment's `main.tf` top to bottom.
