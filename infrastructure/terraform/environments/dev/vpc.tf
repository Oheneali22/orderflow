resource "aws_vpc" "orderflow" {
  cidr_block = "10.20.0.0/16"

  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "orderflow-dev-vpc"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
