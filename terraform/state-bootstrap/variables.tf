variable "aws_region" {
  description = "AWS Region where the remote-state bucket is created."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for names and tags."
  type        = string
  default     = "orderflow"
}
