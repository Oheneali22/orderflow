variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "project_name" {
  type    = string
  default = "orderflow"
}
variable "environment" {
  type    = string
  default = "production"
}
variable "vpc_cidr" {
  type    = string
  default = "10.42.0.0/16"
}
variable "kubernetes_version" {
  type    = string
  default = "1.35"
}
variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}
variable "node_min_size" {
  type    = number
  default = 2
}
variable "node_desired_size" {
  type    = number
  default = 2
}
variable "node_max_size" {
  type    = number
  default = 4
}
variable "cluster_public_access_cidrs" {
  type        = list(string)
  description = "Administrative CIDRs allowed to reach the public EKS API endpoint."
  validation {
    condition     = length(var.cluster_public_access_cidrs) > 0 && !contains(var.cluster_public_access_cidrs, "0.0.0.0/0")
    error_message = "Provide at least one explicit administrative CIDR; 0.0.0.0/0 is prohibited."
  }
}
variable "enable_nat_gateway" {
  type        = bool
  default     = false
  description = "Creates one NAT gateway for workloads requiring arbitrary internet egress. Disabled by default to control cost."
}
variable "database_instance_class" {
  type    = string
  default = "db.t4g.micro"
}
variable "database_allocated_storage" {
  type    = number
  default = 20
}
variable "database_max_allocated_storage" {
  type    = number
  default = 100
}
variable "database_multi_az" {
  type    = bool
  default = false
}
variable "database_deletion_protection" {
  type    = bool
  default = true
}
variable "database_skip_final_snapshot" {
  type    = bool
  default = false
}
