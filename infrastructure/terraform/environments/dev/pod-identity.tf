# --------------------------------------------------
# OrderFlow EKS Pod Identity Association
#
# Connects the Kubernetes ServiceAccount used by
# OrderFlow to the AWS IAM role that can read the
# OrderFlow RDS secret.
# --------------------------------------------------

resource "aws_eks_pod_identity_association" "orderflow" {
  cluster_name = aws_eks_cluster.orderflow.name

  namespace       = "orderflow"
  service_account = "orderflow"

  role_arn = aws_iam_role.orderflow_workload.arn

  tags = {
    Name        = "orderflow-dev-pod-identity"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
