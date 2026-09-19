# --------------------------------------------------
# Amazon EKS Cluster
# --------------------------------------------------

resource "aws_eks_cluster" "orderflow" {
  name     = "orderflow-dev"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.36"

  access_config {
    authentication_mode                         = "API"
    bootstrap_cluster_creator_admin_permissions = true
  }

  vpc_config {
    subnet_ids = [
      aws_subnet.private_eks_a.id,
      aws_subnet.private_eks_b.id
    ]

    # Worker nodes/resources inside the VPC can use
    # the private Kubernetes API endpoint.
    endpoint_private_access = true

    # Allow kubectl access from our workstation.
    endpoint_public_access = true

    # Restrict the public Kubernetes API endpoint
    # to this workstation's current public IP only.
    public_access_cidrs = [
      "104.195.205.226/32"
    ]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]

  tags = {
    Name        = "orderflow-dev"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
