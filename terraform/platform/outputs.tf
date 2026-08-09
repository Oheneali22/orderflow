output "cluster_name" {
  value = aws_eks_cluster.this.name
}
output "cluster_endpoint" {
  value = aws_eks_cluster.this.endpoint
}
output "database_endpoint" {
  value     = aws_db_instance.this.endpoint
  sensitive = true
}
output "database_secret_arn" {
  value = aws_secretsmanager_secret.database.arn
}
output "vpc_id" {
  value = aws_vpc.this.id
}
output "monthly_cost_note" {
  value = "EKS control plane, EC2 nodes, RDS, interface endpoints, and optional NAT incur hourly charges. Keep the stack unapplied unless running a planned demonstration."
}
