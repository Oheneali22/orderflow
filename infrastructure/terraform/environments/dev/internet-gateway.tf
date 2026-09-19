resource "aws_internet_gateway" "orderflow" {
  vpc_id = aws_vpc.orderflow.id

  tags = {
    Name        = "orderflow-dev-igw"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
