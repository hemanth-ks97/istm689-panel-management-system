terraform {

  ##################################################
  # PROVIDERS DECLARATION
  ##################################################

  # Providers are "plugins" that allows terraform to communicate with different cloud services. Like AWS, Cloudflare, Azure, etc.
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

##################################################
# LOCAL VARIABLES
##################################################

# Local variables are used for interpolation of resource output so we can use it somewhere else
# Naming of the variable should be the name of the resource without the provider prefix follow by the name of the variable
locals {
  custom_domain_parse_output = tolist(split(" ", trimspace(element(aws_amplify_domain_association.frontend-domain-association.sub_domain[*].dns_record, 0))))

  custom_domain_verification_parse_output = tolist(split(" ", aws_amplify_domain_association.frontend-domain-association.certificate_verification_dns_record))
}

##################################################
# RESOURCES
##################################################

##########################
# AWS resources
##########################
resource "aws_budgets_budget" "general-budget" {
  name         = "${terraform.workspace}-istm689-general-budget"
  budget_type  = "COST"
  limit_amount = var.budgets_budget_limit_amount[terraform.workspace]
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 70
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = ["joaquin.gimenez@tamu.edu"]
  }
}

resource "aws_amplify_app" "frontend-app" {
  name        = "${terraform.workspace}-frontend-app"
  repository  = var.amplify_app_repository
  oauth_token = var.TF_VAR_GITHUB_TOKEN
  # Protect enviroment with simple username and password
  enable_basic_auth      = true
  basic_auth_credentials = base64encode("panel:panel2024")

  # The default build_spec added by the Amplify Console for React.
  build_spec = <<-EOT
    version: 1
    applications:
      - frontend:
          phases:
            preBuild:
              commands:
                - npm install
                - npm ci
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: build
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
        appRoot: webapp
  EOT

  # The default rewrites and redirects added by the Amplify Console.
  custom_rule {
    source = "/<*>"
    status = "404"
    target = "/index.html"
  }

  # This enviroments variables will be pass to the web app!!! 
  # we should use this to pass the API URL, IDs, somethign we need!
  environment_variables = {
    ENV                        = terraform.workspace
    REACT_APP_API_BASE_URL     = var.amplify_branch_environment_variables_REACT_APP_API_BASE_URL[terraform.workspace]
    REACT_APP_ENV              = terraform.workspace
    REACT_APP_GOOGLE_CLIENT_ID = var.amplify_branch_environment_variables_REACT_APP_GOOGLE_CLIENT_ID[terraform.workspace]
  }
}
resource "aws_amplify_branch" "frontend-branch" {
  app_id      = aws_amplify_app.frontend-app.id
  branch_name = var.amplify_branch_branch_name[terraform.workspace]
  framework   = "React"
}

resource "aws_amplify_domain_association" "frontend-domain-association" {
  app_id                = aws_amplify_app.frontend-app.id
  domain_name           = var.amplify_domain_association_domain_name[terraform.workspace]
  wait_for_verification = false

  sub_domain {
    branch_name = var.amplify_branch_branch_name[terraform.workspace]
    prefix      = ""
  }
}

##########################
# Cloudflare resources
##########################
resource "cloudflare_record" "custom-domain-verification" {
  zone_id         = var.cf_zone_id
  name            = local.custom_domain_verification_parse_output[0]
  value           = local.custom_domain_verification_parse_output[2]
  type            = local.custom_domain_verification_parse_output[1]
  proxied         = false
  allow_overwrite = true
  ttl             = 1
}

resource "cloudflare_record" "custom-domain" {
  zone_id = var.cf_zone_id
  name    = var.amplify_domain_association_domain_name[terraform.workspace]
  value   = local.custom_domain_parse_output[1]
  type    = local.custom_domain_parse_output[0]
  proxied = false
  ttl     = 1
}

##########################
# Database
##########################
resource "aws_dynamodb_table" "user-dynamodb-table" {
  name           = "${terraform.workspace}-User"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "UserID"
  attribute {
    name = "UserID"
    type = "S"
  }
}

resource "aws_dynamodb_table" "question-dynamodb-table" {
  name           = "${terraform.workspace}-Question"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "QuestionID"
  attribute {
    name = "QuestionID"
    type = "S"
  }
}

#question table
resource "aws_dynamodb_table" "question" {
  name           = "${terraform.workspace}-question"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "QuestionID"

  attribute {
    name = "QuestionID"
    type = "S"
  }

  attribute {
    name = "PanelID"
    type = "S"
  }

  global_secondary_index {
    name            = "PanelIDIndex"
    hash_key        = "PanelID"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_global_secondary_idx_read_capacity[terraform.workspace]
    write_capacity  = var.dynamodb_global_secondary_idx_write_capacity[terraform.workspace]
  }
}

#panel table
resource "aws_dynamodb_table" "panel" {
  name           = "${terraform.workspace}-panel"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "PanelID"

  attribute {
    name = "PanelID"
    type = "S"
  }
}

#user table
resource "aws_dynamodb_table" "user" {
  name           = "${terraform.workspace}-user"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "UserID"

  attribute {
    name = "UserID"
    type = "S"
  }
}

#metrics table
resource "aws_dynamodb_table" "metric" {
  name           = "${terraform.workspace}-metric"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "StudentID"
  range_key      = "PanelID"

  attribute {
    name = "StudentID"
    type = "S"
  }

  attribute {
    name = "PanelID"
    type = "S"
  }

  global_secondary_index {
    name            = "StudentIDIndex"
    hash_key        = "StudentID"
    range_key       = "PanelID"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_global_secondary_idx_read_capacity[terraform.workspace]
    write_capacity  = var.dynamodb_global_secondary_idx_write_capacity[terraform.workspace]
  }

  global_secondary_index {
    name            = "PanelIDIndex"
    hash_key        = "PanelID"
    range_key       = "StudentID"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_global_secondary_idx_read_capacity[terraform.workspace]
    write_capacity  = var.dynamodb_global_secondary_idx_write_capacity[terraform.workspace]
  }
}