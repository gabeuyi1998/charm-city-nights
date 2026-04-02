terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
  backend "s3" {
    bucket         = "mtvgabe-terraform-state"
    key            = "api/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "mtvgabe-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
