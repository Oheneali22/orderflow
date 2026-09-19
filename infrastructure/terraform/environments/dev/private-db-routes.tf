# --------------------------------------------------
# Private Database Route Table
# --------------------------------------------------

resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.orderflow.id

  tags = {
    Name        = "orderflow-dev-private-db-rt"
    Project     = "orderflow"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

# --------------------------------------------------
# Associate DB Subnet A
# --------------------------------------------------

resource "aws_route_table_association" "private_db_a" {
  subnet_id      = aws_subnet.private_db_a.id
  route_table_id = aws_route_table.private_db.id
}

# --------------------------------------------------
# Associate DB Subnet B
# --------------------------------------------------

resource "aws_route_table_association" "private_db_b" {
  subnet_id      = aws_subnet.private_db_b.id
  route_table_id = aws_route_table.private_db.id
}
