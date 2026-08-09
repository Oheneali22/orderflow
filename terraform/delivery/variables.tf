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

variable "github_oidc_subject_prefix" {
  description = "Immutable GitHub OIDC subject prefix, including owner and repository IDs."
  type        = string
  default     = "repo:Oheneali22@279475744/orderflow@1327790997"

  validation {
    condition     = startswith(var.github_oidc_subject_prefix, "repo:${var.github_repository_owner}@")
    error_message = "The OIDC subject prefix must use the configured GitHub repository owner."
  }
}

variable "github_repository_owner" {
  description = "GitHub repository owner used to validate the immutable OIDC subject."
  type        = string
  default     = "Oheneali22"
}
