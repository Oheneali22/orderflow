output "ecr_repository_urls" {
  description = "OrderFlow ECR repository URLs."
  value       = { for name, repository in aws_ecr_repository.images : name => repository.repository_url }
}

output "github_actions_role_arn" {
  description = "Role ARN configured as the GitHub Actions AWS_ROLE_ARN repository variable."
  value       = aws_iam_role.github_ecr_publisher.arn
}
