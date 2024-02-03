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

locals {
  budgets_budget_limit_amount = {
    dev = "10"
    prod = "20"
  }
  dynamodb_table_read_capacity = {
    dev = 1
    prod = 2
  }
  dynamodb_table_write_capacity = {
    dev = 1
    prod = 2
  }
}

#################
# AWS RESOURCES #
#################

resource "aws_budgets_budget" "general-budget" {
  name              = "${terraform.workspace}-istm689-general-budget"
  budget_type       = "COST"
  limit_amount      = local.budgets_budget_limit_amount[terraform.workspace]
  limit_unit        = "USD"
  time_unit         = "MONTHLY"


  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 70
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = ["joaquin.gimenez@tamu.edu"]
  }
}

# # Great test table. Deleting now
# resource "aws_dynamodb_table" "gamesscores-test-dynamodb-table" {
#   name           = "${terraform.workspace}-GameScores"
#   billing_mode   = "PROVISIONED"
#   read_capacity  = local.dynamodb_table_read_capacity[terraform.workspace]
#   write_capacity = local.dynamodb_table_write_capacity[terraform.workspace]
#   hash_key       = "UserId"
#   attribute {
#     name = "UserId"
#     type = "S"
#   }
# }
