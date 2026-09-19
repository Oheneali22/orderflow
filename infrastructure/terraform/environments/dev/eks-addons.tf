# --------------------------------------------------
# EKS Pod Identity Agent
#
# Enables Pods associated with IAM roles through
# EKS Pod Identity to receive temporary AWS
# credentials.
# --------------------------------------------------

resource "aws_eks_addon" "pod_identity_agent" {
  cluster_name = aws_eks_cluster.orderflow.name
  addon_name   = "eks-pod-identity-agent"

  tags = {
    Name        = "orderflow-dev-pod-identity-agent"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# --------------------------------------------------
# AWS Secrets Store CSI Driver Provider
#
# Enables Kubernetes Pods to retrieve secrets from
# AWS Secrets Manager and mount them inside the Pod.
# --------------------------------------------------

resource "aws_eks_addon" "secrets_store_csi_provider" {
  cluster_name = aws_eks_cluster.orderflow.name
  addon_name   = "aws-secrets-store-csi-driver-provider"

  depends_on = [
    aws_eks_addon.pod_identity_agent
  ]

  tags = {
    Name        = "orderflow-dev-secrets-store-csi-provider"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
