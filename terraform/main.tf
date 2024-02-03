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

#################
# AWS RESOURCES #
#################

resource "aws_budgets_budget" "general-budget" {
  name              = "istm689-general-budget"
  budget_type       = "COST"
  limit_amount      = "20"
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


resource "aws_dynamodb_table" "gamesscores-dynamodb-table" {
  name           = "GameScores"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "UserId"
  range_key      = "GameTitle"

  attribute {
    name = "UserId"
    type = "S"
  }

    attribute {
    name = "FirstName"
    type = "S"
  }

  attribute {
    name = "LastName"
    type = "S"
  }

}