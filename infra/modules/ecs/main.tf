/* ─────────────────────────────────────────────────────────────────────────────
   ECS on Fargate — the containers that actually serve the site.

   ── One task, deliberately ──────────────────────────────────────────────────
   Next.js keeps its ISR page cache on each container's own filesystem. The
   /api/revalidate webhook the Laravel backend calls after publishing a blog
   post therefore only clears the cache of the ONE container that receives it.

   With a single task that is a non-issue and behaves exactly as Vercel does
   today. With two, a freshly published post appears on one and stays stale on
   the other for up to thirty minutes, seemingly at random — and invalidating
   CloudFront does not fix it, because the next request lands on the stale
   container and re-caches the stale page.

   Raising desired_count above 1 REQUIRES a shared cache handler first (Redis or
   S3 backed) — roughly half a day of work and ~$10/month. Do not scale this by
   changing the number alone.

   ── Who owns the running image ──────────────────────────────────────────────
   Terraform creates the first task definition; CI registers every revision
   after that. Tags are immutable SHAs, so there is no "latest" to re-pull and a
   deploy must be a new revision. The service therefore ignores changes to
   task_definition — without that, every deploy would show up as drift and the
   next apply would roll production back to whatever Terraform last knew about.
   ───────────────────────────────────────────────────────────────────────────── */

resource "aws_cloudwatch_log_group" "app" {
  name = "/ecs/${var.name_prefix}"

  # Logs are billed for ingestion AND storage, and default to never expiring.
  # This is the single cheapest cost control in the whole stack.
  retention_in_days = var.log_retention_days
}

/* ── Execution role: what the ECS agent may do on our behalf ─────────────────
   Distinct from the task role below. This one pulls the image, ships logs, and
   fetches secrets to inject — all before the application starts. The container
   itself never holds these permissions.                                       */
resource "aws_iam_role" "execution" {
  name = "${var.name_prefix}-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Scoped to exactly the secrets this service injects — not secretsmanager:* .
resource "aws_iam_role_policy" "execution_secrets" {
  count = length(var.secret_arns) > 0 ? 1 : 0

  name = "read-injected-secrets"
  role = aws_iam_role.execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = values(var.secret_arns)
    }]
  })
}

/* ── Task role: what the application code itself may do ──────────────────────
   The Next.js server calls the Laravel API over plain HTTPS and needs no AWS
   permissions at all. The role exists so that ECS Exec can work, and so there
   is an obvious place to add a permission later rather than reaching for the
   execution role.                                                             */
resource "aws_iam_role" "task" {
  name = "${var.name_prefix}-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# ECS Exec ("docker exec into a Fargate task") needs these on the TASK role.
resource "aws_iam_role_policy" "task_exec_command" {
  count = var.enable_execute_command ? 1 : 0

  name = "ecs-exec"
  role = aws_iam_role.task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel",
      ]
      Resource = "*"
    }]
  })
}

resource "aws_ecs_cluster" "this" {
  name = var.name_prefix

  setting {
    name  = "containerInsights"
    value = var.container_insights ? "enhanced" : "disabled"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = var.name_prefix
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    # Must match what the image was built for. Graviton would be ~20% cheaper,
    # but GitHub's ARM runners are not free for private repos, so CI would need
    # QEMU emulation on every push. See planning/12-aws-migration-plan.md.
    cpu_architecture = "X86_64"
  }

  container_definitions = jsonencode([{
    name      = "frontend"
    image     = "${var.repository_url}:${var.image_tag}"
    essential = true

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    /* ⚠ HOSTNAME is set explicitly and must stay.

       Fargate overwrites the HOSTNAME environment variable with the container's
       own hostname (ip-10-10-0-151.eu-west-1.compute.internal). Next.js
       standalone reads process.env.HOSTNAME to choose its bind address, so
       without this it binds to that single private address instead of 0.0.0.0 —
       and every health check against 127.0.0.1 fails while the app itself is
       perfectly healthy. The task then loops: start, fail health check, replace.

       This does not reproduce locally: Docker does not inject HOSTNAME the way
       Fargate does. */
    environment = [for k, v in merge({ HOSTNAME = "0.0.0.0" }, var.environment) : { name = k, value = v }]
    secrets     = [for k, v in var.secret_arns : { name = k, valueFrom = v }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "app"
      }
    }

    # Stop a wedged container from sitting there passing TCP checks but serving
    # errors. The ALB checks the same endpoint from outside; this one lets ECS
    # replace the task without waiting for the load balancer to notice.
    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://127.0.0.1:${var.container_port}/api/health >/dev/null 2>&1 || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 20
    }
  }])
}

resource "aws_ecs_service" "app" {
  name            = var.name_prefix
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  enable_execute_command = var.enable_execute_command

  network_configuration {
    subnets         = var.subnet_ids
    security_groups = [var.security_group_id]

    # Required: without a NAT gateway, a task needs a public IP to reach ECR,
    # the API, CloudWatch and Secrets Manager. The security group is what keeps
    # this safe — see modules/network for the full reasoning.
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "frontend"
    container_port   = var.container_port
  }

  # Give the container time to pull (~150MB) and boot before health checks count.
  health_check_grace_period_seconds = 60

  # Rolling deploy: start the new task, wait for it to pass health checks, shift
  # traffic, then stop the old one. 100/200 means never fewer than the desired
  # count are serving.
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  # If the new revision never becomes healthy, roll back automatically instead
  # of leaving the deploy stuck half-finished.
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  # Fail `tofu apply` if the service does not reach a steady state, rather than
  # reporting success while nothing actually runs.
  wait_for_steady_state = true

  lifecycle {
    # CI owns which revision is deployed. See the header.
    ignore_changes = [task_definition]
  }

  depends_on = [aws_iam_role_policy_attachment.execution_managed]
}
