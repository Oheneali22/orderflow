variable "aws_region" {
  description = "AWS Region containing delivery resources."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for resource names and tags."
  type        = string
  default     = "orderflow"
}

variable "github_repository" {
  description = "GitHub owner/repository allowed to publish images."
  type        = string
  default     = "Oheneali22/orderflow"
}
