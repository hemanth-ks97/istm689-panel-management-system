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
    status = "404-200"
    target = "/index.html"
  }

  # This enviroments variables will be pass to the web app!!! 
  # we should use this to pass the API URL, IDs, somethign we need!
  environment_variables = {
    ENV                            = terraform.workspace
    REACT_APP_API_BASE_URL         = var.amplify_branch_environment_variables_REACT_APP_API_BASE_URL[terraform.workspace]
    REACT_APP_ENV                  = terraform.workspace
    REACT_APP_GOOGLE_CLIENT_ID     = var.amplify_branch_environment_variables_REACT_APP_GOOGLE_CLIENT_ID[terraform.workspace]
    REACT_APP_GOOGLE_RECAPTCHA_KEY = var.amplify_branch_environment_variables_REACT_APP_GOOGLE_RECAPTCHA_KEY[terraform.workspace]
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

#### dev ###

#question table
resource "aws_dynamodb_table" "question-table" {
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
resource "aws_dynamodb_table" "panel-table" {
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
resource "aws_dynamodb_table" "user-table" {
  name           = "${terraform.workspace}-user"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "UserID"
  attribute {
    name = "UserID"
    type = "S"
  }
  attribute {
    name = "Role"
    type = "S"
  }
  global_secondary_index {
    name            = "RoleIndex"
    hash_key        = "Role"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_global_secondary_idx_read_capacity[terraform.workspace]
    write_capacity  = var.dynamodb_global_secondary_idx_write_capacity[terraform.workspace]
  }
}

#metric table
resource "aws_dynamodb_table" "metric-table" {
  name           = "${terraform.workspace}-metric"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "UserID"
  range_key      = "PanelID"
  attribute {
    name = "UserID"
    type = "S"
  }
  attribute {
    name = "PanelID"
    type = "S"
  }
  global_secondary_index {
    name            = "UserIDIndex"
    hash_key        = "UserID"
    range_key       = "PanelID"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_global_secondary_idx_read_capacity[terraform.workspace]
    write_capacity  = var.dynamodb_global_secondary_idx_write_capacity[terraform.workspace]
  }
  global_secondary_index {
    name            = "PanelIDIndex"
    hash_key        = "PanelID"
    range_key       = "UserID"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_global_secondary_idx_read_capacity[terraform.workspace]
    write_capacity  = var.dynamodb_global_secondary_idx_write_capacity[terraform.workspace]
  }
}

resource "aws_dynamodb_table" "log-table" {
  name           = "${terraform.workspace}-log"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "LogID"
  attribute {
    name = "LogID"
    type = "S"
  }
}

### local ###
#question table
resource "aws_dynamodb_table" "local-question-table" {
  name           = "local-question"
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
resource "aws_dynamodb_table" "local-panel-table" {
  name           = "local-panel"
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
resource "aws_dynamodb_table" "local-user-table" {
  name           = "local-user"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "UserID"
  attribute {
    name = "UserID"
    type = "S"
  }
  attribute {
    name = "Role"
    type = "S"
  }
  global_secondary_index {
    name            = "RoleIndex"
    hash_key        = "Role"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_global_secondary_idx_read_capacity[terraform.workspace]
    write_capacity  = var.dynamodb_global_secondary_idx_write_capacity[terraform.workspace]
  }
}

#metric table
resource "aws_dynamodb_table" "local-metric-table" {
  name           = "local-metric"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "UserID"
  range_key      = "PanelID"
  attribute {
    name = "UserID"
    type = "S"
  }
  attribute {
    name = "PanelID"
    type = "S"
  }
  global_secondary_index {
    name            = "UserIDIndex"
    hash_key        = "UserID"
    range_key       = "PanelID"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_global_secondary_idx_read_capacity[terraform.workspace]
    write_capacity  = var.dynamodb_global_secondary_idx_write_capacity[terraform.workspace]
  }
  global_secondary_index {
    name            = "PanelIDIndex"
    hash_key        = "PanelID"
    range_key       = "UserID"
    projection_type = "ALL"
    read_capacity   = var.dynamodb_global_secondary_idx_read_capacity[terraform.workspace]
    write_capacity  = var.dynamodb_global_secondary_idx_write_capacity[terraform.workspace]
  }
}

#log table
resource "aws_dynamodb_table" "local-log-table" {
  name           = "local-log"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_table_read_capacity[terraform.workspace]
  write_capacity = var.dynamodb_table_write_capacity[terraform.workspace]
  hash_key       = "LogID"
  attribute {
    name = "LogID"
    type = "S"
  }
}

resource "aws_sesv2_email_identity" "ses-email-identity" {
  email_identity = var.aws_ses_identity_email[terraform.workspace]
}

##########################
# S3
##########################

resource "aws_s3_bucket" "local-bucket-panels-student-data" {
  bucket = "local-istm689-panels-students-data" # Bucket names must be unique across all existing bucket names in Amazon S3

  tags = {
    Name        = "Panels Bucket"
    Environment = "local"
  }
}

resource "aws_s3_bucket" "bucket-panels-students-questions-data" {
  bucket = "${terraform.workspace}-istm689-panels-students-data" # Bucket names must be unique across all existing bucket names in Amazon S3

  tags = {
    Name        = "Panels Bucket"
    Environment = "${terraform.workspace}"
  }
}
