/* ─────────────────────────────────────────────────────────────────────────────
   ECR — where built container images live.

   ── Immutable tags, and no "latest" ─────────────────────────────────────────
   Tags cannot be overwritten. Push a tag twice and the second push is rejected.
   That means a task definition pointing at :a1b2c3d is pointing at exactly the
   bytes that were reviewed and tested, forever — the image cannot change under
   a running service, and a rollback to an old SHA gets the old code rather than
   whatever has since been pushed over it.

   The cost is that "latest" cannot exist here: it is a tag that by definition
   must be overwritten. Deploys therefore reference the git SHA, which is more
   useful anyway — you can read a task definition and know precisely which
   commit is serving traffic.

   ── One repository per account, not a shared one ────────────────────────────
   NEXT_PUBLIC_* values are compiled into the JavaScript bundle at BUILD time,
   so a staging image and a production image are genuinely different artifacts
   and can never be promoted from one to the other. Sharing a registry would
   imply otherwise and invite exactly that mistake.
   ───────────────────────────────────────────────────────────────────────────── */

resource "aws_ecr_repository" "this" {
  name                 = var.name
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    # Basic scanning: free, and flags known CVEs in the image on every push.
    # Findings surface in Security Hub, which the junior engineer owns.
    scan_on_push = true
  }

  encryption_configuration {
    # AES256 is included at no cost. KMS would add a per-key monthly charge for
    # no meaningful gain here — images are not secret, they are our own code.
    encryption_type = "AES256"
  }

  # Refuse to delete a repository that still holds images. Removing this
  # repository should be a deliberate two-step act, not a side effect.
  force_delete = false
}

/* Images accumulate forever otherwise — one per deploy, ~470MB each. Storage is
   $0.10/GB/month, so a year of unchecked daily deploys is real money for
   artifacts nobody will ever pull again. */
resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after ${var.untagged_expire_days} day(s)"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.untagged_expire_days
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep only the most recent ${var.keep_last_n_images} images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = var.keep_last_n_images
        }
        action = { type = "expire" }
      },
    ]
  })
}
