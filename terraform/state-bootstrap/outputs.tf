output "state_bucket_name" {
  description = "Name of the OrderFlow remote-state bucket."
  value       = aws_s3_bucket.terraform_state.id
}

output "aws_region" {
  description = "Region containing the remote-state bucket."
  value       = var.aws_region
}
