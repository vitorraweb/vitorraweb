/* ─────────────────────────────────────────────────────────────────────────────
   GitHub Actions → AWS, without storing a single credential.

   GitHub presents a short-lived signed token describing the workflow that is
   running. AWS trusts that token for one repository on one branch, and hands
   back credentials that expire in an hour. Nothing long-lived exists to leak,
   nothing needs rotating, and revoking access is deleting a role.

   ── The condition below is the whole security boundary ──────────────────────
   The `sub` claim must be pinned to an exact ref. The common shortcut

       "repo:org/repo:*"

   lets ANY branch and ANY pull request from ANY fork assume this role — which
   means anyone who can open a PR can deploy to production. Scoped here to the
   exact branch, so a PR build cannot deploy.

   Tighter still, when you want a human approval gate: create a GitHub
   Environment named "production" with required reviewers and change the claim
   to "repo:org/repo:environment:production".
   ───────────────────────────────────────────────────────────────────────────── */

resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_oidc_provider ? 1 : 0

  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  # AWS validates GitHub's certificate against its own trust store for this
  # well-known provider, so these values are no longer load-bearing. The API
  # still requires the field.
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}

locals {
  oidc_arn = var.create_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : var.existing_oidc_provider_arn
}

resource "aws_iam_role" "deploy" {
  name        = "${var.name_prefix}-github-deploy"
  description = "Assumed by GitHub Actions to build, push and deploy the frontend."

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = local.oidc_arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = var.allowed_subjects
        }
      }
    }]
  })

  # An hour is plenty for a build and deploy, and bounds the damage if a token
  # ever escapes a runner.
  max_session_duration = 3600
}

resource "aws_iam_role_policy" "deploy" {
  name = "deploy-frontend"
  role = aws_iam_role.deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Only grantable account-wide; it returns a token, not access.
        Sid      = "EcrLogin"
        Effect   = "Allow"
        Action   = "ecr:GetAuthorizationToken"
        Resource = "*"
      },
      {
        Sid    = "PushToOurRepositoryOnly"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:DescribeImages",
        ]
        Resource = var.ecr_repository_arn
      },
      {
        # RegisterTaskDefinition cannot be scoped to a resource — AWS does not
        # support it. Describe is needed to read the current revision first.
        Sid    = "RegisterTaskDefinitions"
        Effect = "Allow"
        Action = [
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeTaskDefinition",
        ]
        Resource = "*"
      },
      {
        Sid    = "DeployThisServiceOnly"
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
        ]
        Resource = var.ecs_service_arn
      },
      {
        # RegisterTaskDefinition attaches the execution and task roles, which
        # counts as passing them. Restricted to those two roles and to ECS, so
        # this cannot be used to attach a more privileged role to anything.
        Sid      = "PassOnlyTheTaskRoles"
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = var.passable_role_arns
        Condition = {
          StringEquals = {
            "iam:PassedToService" = "ecs-tasks.amazonaws.com"
          }
        }
      },
    ]
  })
}
