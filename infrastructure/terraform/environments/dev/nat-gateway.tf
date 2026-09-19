# --------------------------------------------------
# Elastic IP for NAT Gateway
# --------------------------------------------------

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "orderflow-dev-nat-eip"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# --------------------------------------------------
# NAT Gateway
# --------------------------------------------------

resource "aws_nat_gateway" "orderflow" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id

  depends_on = [
    aws_internet_gateway.orderflow
  ]

  tags = {
    Name        = "orderflow-dev-nat"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
