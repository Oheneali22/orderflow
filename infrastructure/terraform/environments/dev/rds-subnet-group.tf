# --------------------------------------------------
# RDS DB Subnet Group
# --------------------------------------------------

resource "aws_db_subnet_group" "orderflow" {
  name        = "orderflow-dev-db-subnet-group"
  description = "Private database subnets for OrderFlow RDS"

  subnet_ids = [
    aws_subnet.private_db_a.id,
    aws_subnet.private_db_b.id
  ]

  tags = {
    Name        = "orderflow-dev-db-subnet-group"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
