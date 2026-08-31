/* ─────────────────────────────────────────────────────────────────────────────
   CloudFront — the CDN, TLS termination and WAF attachment point.

   ── The locale trap ─────────────────────────────────────────────────────────
   The DEFAULT behaviour deliberately does NOT cache.

   next-intl decides language per request from the NEXT_LOCALE cookie and the
   Accept-Language header, then redirects / to /sw or /fr. Measured against the
   real container, one URL gives three different answers:

       Accept-Language: en      →  200, English inline
       Accept-Language: sw      →  307 → /sw
       Cookie: NEXT_LOCALE=sw   →  307 → /sw

   Cache that without varying on both, and the first visitor's language becomes
   every visitor's language. A Swahili speaker arrives first and the whole world
   gets a Swahili homepage.

   Not caching HTML is correct rather than merely safe: the origin already
   caches through Next's ISR, so pages are still fast. Caching HTML here is a
   later, deliberate optimisation needing a cache policy keyed on the
   NEXT_LOCALE cookie AND the Accept-Language header — not something to reach
   for casually.

   Static assets are a different matter and are cached hard: their filenames are
   content-hashed, so they can never be stale.
   ───────────────────────────────────────────────────────────────────────────── */

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

/* Forwards every header, cookie and query string to the origin — including
   Host. That matters: Next builds redirect URLs from the incoming Host, so
   rewriting it to the load balancer's hostname would send visitors to an
   elb.amazonaws.com address. */
data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}

/* next/image serves different bytes for the same path depending on the query
   string (?url=&w=&q=) and on Accept (webp vs avif vs png). The managed
   CachingOptimized policy ignores query strings, which would serve one size to
   everyone, so images need their own policy. */
resource "aws_cloudfront_cache_policy" "images" {
  name        = "${var.name_prefix}-images"
  comment     = "next/image: vary on query string and Accept."
  default_ttl = 86400
  min_ttl     = 0
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    query_strings_config {
      query_string_behavior = "all"
    }

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Accept"]
      }
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}

resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  comment         = var.name_prefix
  aliases         = [var.domain_name]
  is_ipv6_enabled = true
  http_version    = "http2and3"

  # Africa, Europe, North America, Middle East and Asia. Excludes South America
  # and Oceania, which are the expensive tiers and not our market — visitors
  # there are still served, just from a further edge.
  price_class = "PriceClass_200"

  web_acl_id = var.web_acl_arn

  origin {
    origin_id   = "alb"
    domain_name = var.origin_domain_name

    custom_origin_config {
      origin_protocol_policy = "https-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_read_timeout    = 60
    }

    /* The shared secret the load balancer demands. Its listener returns a flat
       403 to anything without this, so nobody who discovers the load balancer's
       hostname can bypass the CDN, and with it the WAF and rate limiting. */
    custom_header {
      name  = "X-Origin-Verify"
      value = var.origin_verify_secret
    }
  }

  # ── Default: everything not matched below. NOT cached — see the header. ──
  default_cache_behavior {
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    allowed_methods = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  # ── Immutable build output: content-hashed filenames, safe to cache forever ──
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  ordered_cache_behavior {
    path_pattern           = "/_next/image*"
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id = aws_cloudfront_cache_policy.images.id
  }

  # Static files we ship in public/ — photography, PDFs, video.
  dynamic "ordered_cache_behavior" {
    for_each = var.static_path_patterns

    content {
      path_pattern           = ordered_cache_behavior.value
      target_origin_id       = "alb"
      viewer_protocol_policy = "redirect-to-https"
      compress               = true

      allowed_methods = ["GET", "HEAD"]
      cached_methods  = ["GET", "HEAD"]

      cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.certificate_arn
    ssl_support_method  = "sni-only"
    # TLS 1.2 floor. 1.0 and 1.1 are deprecated and fail modern audits.
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
