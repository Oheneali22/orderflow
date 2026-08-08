variable "aws_region" {
  description = "AWS Region where the Terraform state bucket will be created."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used when naming and tagging bootstrap resources."
  type        = string
  default     = "beacon"
}
