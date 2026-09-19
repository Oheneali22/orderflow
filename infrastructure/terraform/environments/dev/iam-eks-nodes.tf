# --------------------------------------------------
# EKS Worker Node IAM Role
# --------------------------------------------------

resource "aws_iam_role" "eks_nodes" {
  name = "orderflow-dev-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "orderflow-dev-eks-node-role"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# --------------------------------------------------
# EKS Worker Node Permissions
# --------------------------------------------------

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}

# --------------------------------------------------
# ECR Pull Permissions
# --------------------------------------------------

resource "aws_iam_role_policy_attachment" "eks_ecr_pull_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPullOnly"
}

# --------------------------------------------------
# VPC CNI Permissions
#
# Bootstrap configuration.
# Later we will move this to a dedicated IAM
# identity for the VPC CNI.
# --------------------------------------------------

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  role       = aws_iam_role.eks_nodes.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}
