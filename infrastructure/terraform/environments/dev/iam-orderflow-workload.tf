# --------------------------------------------------
# OrderFlow Workload IAM Role
#
# This role will eventually be associated with the
# Kubernetes ServiceAccount used by the OrderFlow
# API and Worker Pods.
# --------------------------------------------------

resource "aws_iam_role" "orderflow_workload" {
  name = "orderflow-dev-workload-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "pods.eks.amazonaws.com"
        }

        Action = [
          "sts:AssumeRole",
          "sts:TagSession"
        ]
      }
    ]
  })

  tags = {
    Name        = "orderflow-dev-workload-role"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# --------------------------------------------------
# Permission Policy
#
# Allows OrderFlow to read ONLY the RDS-managed
# master credential stored in Secrets Manager.
# --------------------------------------------------

resource "aws_iam_policy" "orderflow_rds_secret" {
  name        = "orderflow-dev-rds-secret-read"
  description = "Allow OrderFlow workload to read its RDS database secret"

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]

        Resource = aws_db_instance.orderflow.master_user_secret[0].secret_arn
      }
    ]
  })

  tags = {
    Name        = "orderflow-dev-rds-secret-read"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# --------------------------------------------------
# Attach Secret Permission Policy to Workload Role
# --------------------------------------------------

resource "aws_iam_role_policy_attachment" "orderflow_rds_secret" {
  role       = aws_iam_role.orderflow_workload.name
  policy_arn = aws_iam_policy.orderflow_rds_secret.arn
}
