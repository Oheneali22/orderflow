resource "aws_security_group" "database" {
  name_prefix = "${local.name}-database-"
  vpc_id      = aws_vpc.this.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_eks_cluster.this.vpc_config[0].cluster_security_group_id]
  }
}
resource "aws_db_subnet_group" "this" {
  name       = local.name
  subnet_ids = aws_subnet.private[*].id
}
resource "random_password" "database" {
  length           = 32
  special          = true
  override_special = "!#$%&*+-.:=?@^_"
}
resource "aws_db_instance" "this" {
  identifier                   = local.name
  engine                       = "postgres"
  engine_version               = "16"
  instance_class               = var.database_instance_class
  allocated_storage            = var.database_allocated_storage
  max_allocated_storage        = var.database_max_allocated_storage
  storage_type                 = "gp3"
  storage_encrypted            = true
  db_name                      = "orderflow"
  username                     = "orderflow_admin"
  password                     = random_password.database.result
  port                         = 5432
  multi_az                     = var.database_multi_az
  publicly_accessible          = false
  backup_retention_period      = 7
  copy_tags_to_snapshot        = true
  deletion_protection          = var.database_deletion_protection
  skip_final_snapshot          = var.database_skip_final_snapshot
  final_snapshot_identifier    = var.database_skip_final_snapshot ? null : "${local.name}-final"
  auto_minor_version_upgrade   = true
  performance_insights_enabled = true
  db_subnet_group_name         = aws_db_subnet_group.this.name
  vpc_security_group_ids       = [aws_security_group.database.id]
}
resource "aws_secretsmanager_secret" "database" {
  name                    = "${local.name}/database-url"
  recovery_window_in_days = 7
}
resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${aws_db_instance.this.username}:${urlencode(random_password.database.result)}@${aws_db_instance.this.address}:${aws_db_instance.this.port}/${aws_db_instance.this.db_name}?sslmode=require"
  })
}
