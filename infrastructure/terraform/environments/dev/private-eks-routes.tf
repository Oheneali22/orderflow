# --------------------------------------------------
# Private EKS Route Table - AZ A
# --------------------------------------------------

resource "aws_route_table" "private_eks_a" {
  vpc_id = aws_vpc.orderflow.id

  tags = {
    Name        = "orderflow-dev-private-eks-a-rt"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

resource "aws_route" "private_eks_a_nat" {
  route_table_id         = aws_route_table.private_eks_a.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.orderflow.id
}

resource "aws_route_table_association" "private_eks_a" {
  subnet_id      = aws_subnet.private_eks_a.id
  route_table_id = aws_route_table.private_eks_a.id
}

# --------------------------------------------------
# Private EKS Route Table - AZ B
# --------------------------------------------------

resource "aws_route_table" "private_eks_b" {
  vpc_id = aws_vpc.orderflow.id

  tags = {
    Name        = "orderflow-dev-private-eks-b-rt"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

resource "aws_route" "private_eks_b_nat" {
  route_table_id         = aws_route_table.private_eks_b.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.orderflow.id
}

resource "aws_route_table_association" "private_eks_b" {
  subnet_id      = aws_subnet.private_eks_b.id
  route_table_id = aws_route_table.private_eks_b.id
}
