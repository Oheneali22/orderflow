# --------------------------------------------------
# OrderFlow PostgreSQL RDS Instance
# --------------------------------------------------

resource "aws_db_instance" "orderflow" {
  identifier = "orderflow-dev-postgres"

  # ------------------------------------------------
  # Database Engine
  # --------------------------------------------------

  engine         = "postgres"
  engine_version = "18.6"

  db_name  = "orderflow"
  username = "orderflow_admin"
  port     = 5432

  # Let RDS generate and manage the master password
  # securely in AWS Secrets Manager.
  manage_master_user_password = true

  # ------------------------------------------------
  # Compute
  # --------------------------------------------------

  instance_class = "db.t4g.micro"

  # ------------------------------------------------
  # Storage
  # --------------------------------------------------

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  # ------------------------------------------------
  # Networking
  # --------------------------------------------------

  db_subnet_group_name = aws_db_subnet_group.orderflow.name

  vpc_security_group_ids = [
    aws_security_group.rds.id
  ]

  publicly_accessible = false

  # ------------------------------------------------
  # Availability
  #
  # Lab decision:
  # Single-AZ keeps cost lower.
  #
  # Production would normally evaluate Multi-AZ.
  # ------------------------------------------------

  multi_az = false

  # ------------------------------------------------
  # Backups and Maintenance
  # ------------------------------------------------

  backup_retention_period = 7

  auto_minor_version_upgrade = true
  apply_immediately          = true

  # ------------------------------------------------
  # Deletion Behavior
  #
  # Lab settings so Terraform can cleanly destroy
  # the environment without requiring a final snapshot.
  #
  # Production should use deletion protection and
  # retain a final snapshot.
  # ------------------------------------------------

  deletion_protection = false
  skip_final_snapshot = true

  tags = {
    Name        = "orderflow-dev-postgres"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
