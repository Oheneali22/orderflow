# --------------------------------------------------
# EKS Managed Node Group
# --------------------------------------------------

resource "aws_eks_node_group" "orderflow" {
  cluster_name    = aws_eks_cluster.orderflow.name
  node_group_name = "orderflow-dev-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn

  subnet_ids = [
    aws_subnet.private_eks_a.id,
    aws_subnet.private_eks_b.id
  ]

  instance_types = [
    "t3.medium"
  ]

  capacity_type = "ON_DEMAND"

  disk_size = 20

  scaling_config {
    desired_size = 2
    min_size     = 2
    max_size     = 3
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_ecr_pull_policy,
    aws_iam_role_policy_attachment.eks_cni_policy
  ]

  tags = {
    Name        = "orderflow-dev-nodes"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
