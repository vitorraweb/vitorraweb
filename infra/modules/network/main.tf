/* ─────────────────────────────────────────────────────────────────────────────
   Network — VPC, public subnets across two availability zones, and the two
   security groups that carry the actual access control.

   ── The public-subnet decision ──────────────────────────────────────────────
   Fargate tasks run in PUBLIC subnets with a public IP. Anyone taught "app
   servers belong in private subnets" should read this before objecting.

   A task in a private subnet cannot reach the internet on its own. It needs a
   NAT Gateway to pull images from ECR, call api.vitorra.org, ship logs to
   CloudWatch and read secrets. A NAT Gateway costs ~$32/month plus data —
   comfortably more than the compute it exists to serve, and the single largest
   line item in this whole architecture. VPC endpoints for the same services
   cost roughly the same.

   A public IP is not itself an exposure. The security group is the real
   boundary, and the tasks group below accepts traffic from the load balancer
   and from nothing else. Nothing on the internet can open a connection to a
   task.

   Revisit this if we ever put a database in the VPC. Until then it is the right
   trade, and it is a trade — not an oversight.
   ───────────────────────────────────────────────────────────────────────────── */

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # An Application Load Balancer requires subnets in at least two availability
  # zones, so this is a floor, not a preference.
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  # Both required for tasks to resolve DNS — including api.vitorra.org.
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = var.name_prefix }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = var.name_prefix }
}

/* Subnets are carved as /24s out of the /16: 10.0.0.0/24, 10.0.1.0/24, …
   That is 251 usable addresses each (AWS reserves five), far more than a
   handful of tasks and a load balancer will ever need.

   Blocks from 10.0.128.0 up are deliberately left unused, so private subnets
   can be added later without renumbering anything that already exists. */
resource "aws_subnet" "public" {
  for_each = { for i, az in local.azs : az => i }

  vpc_id                  = aws_vpc.main.id
  availability_zone       = each.key
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, each.value)
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.name_prefix}-public-${each.key}"
    Tier = "public"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.name_prefix}-public" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

/* ── Load balancer security group ────────────────────────────────────────────
   Ingress is restricted to CloudFront's own edge servers using the AWS-managed
   prefix list, rather than 0.0.0.0/0. Without this, anyone who discovers the
   load balancer's DNS name can bypass CloudFront entirely — and with it, the
   WAF, the rate limiting and the caching. This is gotcha #7 in the migration
   plan; the X-Origin-Verify header added later is the second layer.           */

data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb"
  description = "Public entry point. Accepts HTTPS from CloudFront edges only."
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.name_prefix}-alb" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_https_from_cloudfront" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS from CloudFront edge servers"

  prefix_list_id = data.aws_ec2_managed_prefix_list.cloudfront.id
  ip_protocol    = "tcp"
  from_port      = 443
  to_port        = 443
}

/* Temporary direct access, for testing the load balancer before CloudFront sits
   in front of it. Default is empty — an empty list creates no rules at all.
   Set it to your own address as a /32, and take it back out once CloudFront is
   live. Both ports are opened because HTTPS needs a certificate on a real
   hostname, which does not exist until DNS is cut over.

   ⚠ Anything left here bypasses CloudFront, and therefore the WAF and the rate
   limiting, for whoever holds that address. */
resource "aws_vpc_security_group_ingress_rule" "alb_extra_https" {
  for_each = toset(var.alb_ingress_extra_cidrs)

  security_group_id = aws_security_group.alb.id
  description       = "Temporary direct access for testing (HTTPS)"

  cidr_ipv4   = each.value
  ip_protocol = "tcp"
  from_port   = 443
  to_port     = 443
}

resource "aws_vpc_security_group_ingress_rule" "alb_extra_http" {
  for_each = toset(var.alb_ingress_extra_cidrs)

  security_group_id = aws_security_group.alb.id
  description       = "Temporary direct access for testing (HTTP, pre-certificate)"

  cidr_ipv4   = each.value
  ip_protocol = "tcp"
  from_port   = 80
  to_port     = 80
}

resource "aws_vpc_security_group_egress_rule" "alb_to_tasks" {
  security_group_id = aws_security_group.alb.id
  description       = "Forward to the application containers"

  referenced_security_group_id = aws_security_group.tasks.id
  ip_protocol                  = "tcp"
  from_port                    = var.container_port
  to_port                      = var.container_port
}

/* ── Task security group ─────────────────────────────────────────────────────
   This is the boundary that makes running in a public subnet safe. The only
   ingress rule references the load balancer's security group by id, so the
   rule follows the load balancer rather than an IP address that might change.
   There is no path from the internet to a task.                               */

resource "aws_security_group" "tasks" {
  name        = "${var.name_prefix}-tasks"
  description = "Application containers. Reachable only from the load balancer."
  vpc_id      = aws_vpc.main.id

  tags = { Name = "${var.name_prefix}-tasks" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "tasks_from_alb" {
  security_group_id = aws_security_group.tasks.id
  description       = "Application port, from the load balancer only"

  referenced_security_group_id = aws_security_group.alb.id
  ip_protocol                  = "tcp"
  from_port                    = var.container_port
  to_port                      = var.container_port
}

/* Egress is left open deliberately. Tasks must reach ECR, api.vitorra.org,
   Secrets Manager and CloudWatch Logs, none of which have stable addresses, and
   DNS resolution needs UDP 53 to the VPC resolver. Restricting egress to TCP
   443 is a common mistake that breaks name resolution in a way that looks like
   a networking fault rather than a firewall rule. */
resource "aws_vpc_security_group_egress_rule" "tasks_all" {
  security_group_id = aws_security_group.tasks.id
  description       = "Outbound to ECR, the API, Secrets Manager, CloudWatch"

  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"
}
