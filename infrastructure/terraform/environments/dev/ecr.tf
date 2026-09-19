# --------------------------------------------------
# OrderFlow API ECR Repository
#
# Stores container images for the OrderFlow API.
# --------------------------------------------------

resource "aws_ecr_repository" "api" {
  name                 = "orderflow-api"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "orderflow-api"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# --------------------------------------------------
# OrderFlow Worker ECR Repository
#
# Stores container images for the OrderFlow worker.
# --------------------------------------------------

resource "aws_ecr_repository" "worker" {
  name                 = "orderflow-worker"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "orderflow-worker"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# --------------------------------------------------
# Outputs
#
# These URLs will later be referenced when tagging
# Docker images and configuring Kubernetes workloads.
# --------------------------------------------------

output "ecr_api_repository_url" {
  description = "ECR repository URL for the OrderFlow API"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_worker_repository_url" {
  description = "ECR repository URL for the OrderFlow worker"
  value       = aws_ecr_repository.worker.repository_url
}
