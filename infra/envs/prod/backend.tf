/* Remote state in the bucket created by infra/bootstrap.

   Backend blocks cannot use variables, so the bucket name is written out in
   full. It embeds the account id, which is what makes it globally unique.

   use_lockfile puts the state lock in S3 itself. Older guides tell you to
   create a DynamoDB table for locking — that is no longer needed, and skipping
   it removes a resource and a small monthly bill.                            */
terraform {
  backend "s3" {
    bucket       = "vitorra-tfstate-574247905057"
    key          = "prod/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }
}
