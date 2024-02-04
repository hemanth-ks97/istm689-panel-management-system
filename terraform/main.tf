# main.tf

terraform {

  #############
  # PROVIDERS #
  #############

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

##################
# PROVIDER SETUP #
##################

# AWS Provider
# To make this provider work we added enviroment variables to terraform cloud
# Link: https://app.terraform.io/app/istm689-panel-management-system-org/workspaces
# Sensitive environment variables
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
provider "aws" {
  region = "us-east-1"
}

# Cloudflare Provider
# To make this provider work we added enviroment variables to terraform cloud
# Link: https://app.terraform.io/app/istm689-panel-management-system-org/workspaces
# Sensitive environment variable
# - CLOUDFLARE_API_TOKEN

###################
# LOCAL VARIABLES #
###################

# Local variables to configure a specific parameter taking into account the workspace name (dev, prod)
# Naming of the variable should be the name of the resource without the provider prefix follow by the name of the variable
locals {
  budgets_budget_limit_amount = {
    dev  = "10"
    prod = "20"
  }
  dynamodb_table_read_capacity = {
    dev  = 1
    prod = 1
  }
  dynamodb_table_write_capacity = {
    dev  = 1
    prod = 1
  }

  amplify_branch_branch_name = {
    dev  = "dev"
    prod = "main"
  }
  amplify_domain_association_domain_name = {
    dev  = "istm689-dev.joaquingimenez.com"
    prod = "istm689.joaquingimenez.com"
  }

  # TODO, need to be the base URL from the API gateway instance
  amplify_branch_environment_variables_REACT_APP_API_SERVER = {
    dev  = "https://api-dev.example.com"
    prod = "https://api.example.com"
  }
}



#############
# RESOURCES #
#############

# AWS resources
resource "aws_budgets_budget" "general-budget" {
  name         = "${terraform.workspace}-istm689-general-budget"
  budget_type  = "COST"
  limit_amount = local.budgets_budget_limit_amount[terraform.workspace]
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
  name       = "${terraform.workspace}-frontend-app"
  repository = var.amplify_app_repository
  # TODO: Need to figure a better way to pass the token!
  oauth_token = var.TF_VAR_GITHUB_TOKEN

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
    ENV                      = terraform.workspace
    REACT_APP_API_SERVER     = local.amplify_branch_environment_variables_REACT_APP_API_SERVER[terraform.workspace]
    REACT_APP_ENV            = terraform.workspace
    REACT_APP_GIT_COMMIT_SHA = var.TFC_CONFIGURATION_VERSION_GIT_COMMIT_SHA
  }
}
resource "aws_amplify_branch" "frontend-branch" {
  app_id      = aws_amplify_app.frontend-app.id
  branch_name = local.amplify_branch_branch_name[terraform.workspace]
  framework   = "React"
}

resource "aws_amplify_domain_association" "frontend-domain-association" {
  app_id                = aws_amplify_app.frontend-app.id
  domain_name           = local.amplify_domain_association_domain_name[terraform.workspace]
  wait_for_verification = false

  sub_domain {
    branch_name = local.amplify_branch_branch_name[terraform.workspace]
    prefix      = ""
  }
}

# Cloudflare resources
resource "cloudflare_record" "custom-domain-verification" {
  zone_id         = var.cf_zone_id
  name            = tolist(split(" ", aws_amplify_domain_association.frontend-domain-association.certificate_verification_dns_record))[0]
  value           = tolist(split(" ", aws_amplify_domain_association.frontend-domain-association.certificate_verification_dns_record))[2]
  type            = tolist(split(" ", aws_amplify_domain_association.frontend-domain-association.certificate_verification_dns_record))[1]
  proxied         = false
  allow_overwrite = true
  ttl             = 1
}

resource "cloudflare_record" "custom-domain" {
  zone_id = var.cf_zone_id
  name    = local.amplify_domain_association_domain_name[terraform.workspace]
  value   = tolist(split(" ", trimspace(element(aws_amplify_domain_association.frontend-domain-association.sub_domain[*].dns_record, 0))))[1]
  type    = tolist(split(" ", trimspace(element(aws_amplify_domain_association.frontend-domain-association.sub_domain[*].dns_record, 0))))[0]
  proxied = false
  ttl     = 1
}

# # Great test table for demo.
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

