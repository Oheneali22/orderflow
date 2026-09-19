data "aws_availability_zones" "available" {
  state = "available"
}

# --------------------------------------------------
# Public Subnets
# --------------------------------------------------

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.orderflow.id
  cidr_block        = "10.20.0.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "orderflow-dev-public-a"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"

    "kubernetes.io/role/elb" = "1"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id            = aws_vpc.orderflow.id
  cidr_block        = "10.20.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "orderflow-dev-public-b"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"

    "kubernetes.io/role/elb" = "1"
  }
}

# --------------------------------------------------
# Private EKS Subnets
# --------------------------------------------------

resource "aws_subnet" "private_eks_a" {
  vpc_id            = aws_vpc.orderflow.id
  cidr_block        = "10.20.16.0/20"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "orderflow-dev-private-eks-a"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"

    "kubernetes.io/role/internal-elb" = "1"
  }
}

resource "aws_subnet" "private_eks_b" {
  vpc_id            = aws_vpc.orderflow.id
  cidr_block        = "10.20.32.0/20"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "orderflow-dev-private-eks-b"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"

    "kubernetes.io/role/internal-elb" = "1"
  }
}

# --------------------------------------------------
# Private Database Subnets
# --------------------------------------------------

resource "aws_subnet" "private_db_a" {
  vpc_id            = aws_vpc.orderflow.id
  cidr_block        = "10.20.100.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "orderflow-dev-private-db-a"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

resource "aws_subnet" "private_db_b" {
  vpc_id            = aws_vpc.orderflow.id
  cidr_block        = "10.20.101.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "orderflow-dev-private-db-b"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
