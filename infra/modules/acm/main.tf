/* ─────────────────────────────────────────────────────────────────────────────
   ACM certificate, validated by DNS.

   Two separate certificates are needed for one site, which catches people out:

     • The LOAD BALANCER's certificate must live in the same region as the load
       balancer (eu-west-1). It covers the origin hostname.
     • CLOUDFRONT only accepts certificates from us-east-1, no matter where
       everything else runs. It covers the public hostname.

   Instantiate this module twice, passing providers = { aws = aws.us_east_1 }
   for the CloudFront one.

   ── DNS validation records are permanent ────────────────────────────────────
   AWS renews these certificates automatically, and renewal re-checks the same
   CNAME. Delete the validation record after issuance and the certificate simply
   stops renewing — roughly a year later, quietly, on a weekend. Leave them in
   place forever.
   ───────────────────────────────────────────────────────────────────────────── */

resource "aws_acm_certificate" "this" {
  domain_name               = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  validation_method         = "DNS"

  # Replace before destroying — a certificate in use by a listener or a
  # distribution cannot be deleted.
  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = var.domain_name }
}
