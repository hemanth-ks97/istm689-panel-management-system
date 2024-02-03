terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider

# To make this provider work we added enviroment variables to terraform cloud
# 
# Link: https://app.terraform.io/app/istm689-panel-management-system-org/workspaces
# Sensitive environment variables
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
provider "aws" {
  region = "us-east-1"

}

# # Create a VPC
# resource "aws_vpc" "test-vpc" {
#   cidr_block = "10.20.1.0/24"
# }

# resource "aws_vpc" "test2-vpc" {
#   cidr_block = "10.30.1.0/24"
# }