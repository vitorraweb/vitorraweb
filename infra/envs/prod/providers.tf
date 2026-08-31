provider "aws" {
  region = var.region

  # If AWS_PROFILE is stale, refuse to run rather than quietly building this
  # environment's resources in the wrong account.
  allowed_account_ids = [var.account_id]

  default_tags {
    tags = {
      Project   = "vitorra"
      Env       = var.env
      ManagedBy = "opentofu"
    }
  }
}

/* CloudFront only accepts ACM certificates issued in us-east-1, no matter where
   the rest of the stack lives. This aliased provider exists solely to request
   that certificate; everything else uses the default provider above.          */
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  allowed_account_ids = [var.account_id]

  default_tags {
    tags = {
      Project   = "vitorra"
      Env       = var.env
      ManagedBy = "opentofu"
    }
  }
}
