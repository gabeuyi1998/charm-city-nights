variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain" {
  description = "Production domain"
  type        = string
  default     = "mtvgabe.com"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}
