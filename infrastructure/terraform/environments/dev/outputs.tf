output "vpc_id" {
  description = "VPC ID for the OrderFlow environment"
  value       = aws_vpc.orderflow.id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.orderflow.name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.orderflow.address
}

output "rds_secret_arn" {
  description = "ARN of the RDS-managed master user secret"
  value       = aws_db_instance.orderflow.master_user_secret[0].secret_arn
}

output "aws_region" {
  description = "AWS region for this environment"
  value       = "us-east-1"
}
