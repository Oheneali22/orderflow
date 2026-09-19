# --------------------------------------------------
# RDS Security Group
# --------------------------------------------------

resource "aws_security_group" "rds" {
  name        = "orderflow-dev-rds-sg"
  description = "Security group for OrderFlow PostgreSQL RDS"
  vpc_id      = aws_vpc.orderflow.id

  tags = {
    Name        = "orderflow-dev-rds-sg"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# --------------------------------------------------
# Allow PostgreSQL traffic from EKS
# --------------------------------------------------

resource "aws_vpc_security_group_ingress_rule" "rds_postgres_from_eks" {
  security_group_id = aws_security_group.rds.id

  referenced_security_group_id = aws_eks_cluster.orderflow.vpc_config[0].cluster_security_group_id

  ip_protocol = "tcp"
  from_port   = 5432
  to_port     = 5432

  description = "Allow PostgreSQL traffic from OrderFlow EKS"
}
