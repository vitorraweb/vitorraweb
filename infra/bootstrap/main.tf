/* ─────────────────────────────────────────────────────────────────────────────
   Bootstrap — the one piece of infrastructure that cannot manage itself.

   Everything else in infra/ keeps its state in S3. This creates that bucket, so
   it necessarily keeps its own state in a LOCAL file. That state is NOT committed
   (see .gitignore) — state files are plaintext and we never want the habit.

   Losing this particular state file is recoverable and not an emergency: the
   bucket still exists, and you adopt it again with
     tofu import aws_s3_bucket.state vitorra-tfstate-<account-id>

   Run once per account:
     cd infra/bootstrap
     AWS_PROFILE=vitorra-prod tofu init && tofu apply

   See infra/README.md.
   ───────────────────────────────────────────────────────────────────────────── */

terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region

  # Refuse to run against an account we did not mean to touch. Without this, a
  # stale AWS_PROFILE silently applies production config to the wrong account.
  allowed_account_ids = [var.account_id]

  default_tags {
    tags = {
      Project   = "vitorra"
      Env       = var.env
      ManagedBy = "opentofu"
      Component = "bootstrap"
    }
  }
}

# Bucket names are globally unique across all of AWS, so the account id is
# appended. This also matches the `vitorra-tfstate-*` pattern that the
# VitorraObserver permission set denies outright — state can contain secrets in
# plaintext, so the junior engineer must never be able to read it.
locals {
  bucket_name = "vitorra-tfstate-${var.account_id}"
}

resource "aws_s3_bucket" "state" {
  bucket = local.bucket_name

  # State is the record of everything we own. Losing it means rebuilding the
  # world by hand, so make it awkward to delete by accident.
  lifecycle {
    prevent_destroy = true
  }
}

# Every apply writes a new version. This is the undo button when a bad apply
# corrupts state — you can roll back to the previous object version.
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Old state versions accumulate forever otherwise. Ninety days is long enough to
# recover from a mistake nobody noticed for a month.
resource "aws_s3_bucket_lifecycle_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    id     = "expire-old-state-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  depends_on = [aws_s3_bucket_versioning.state]
}

# Refuse any request that is not TLS. Belt and braces — the bucket is private
# already, but state in flight should never touch plaintext HTTP.
resource "aws_s3_bucket_policy" "state_tls_only" {
  bucket = aws_s3_bucket.state.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource = [
        aws_s3_bucket.state.arn,
        "${aws_s3_bucket.state.arn}/*",
      ]
      Condition = {
        Bool = { "aws:SecureTransport" = "false" }
      }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.state]
}

output "state_bucket" {
  value       = aws_s3_bucket.state.id
  description = "Put this in the backend block of infra/envs/<env>/backend.tf"
}
