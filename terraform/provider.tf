##################################################
# PROVIDER SETUP
##################################################

##########################
# AWS Provider
##########################

# To make this provider work we added enviroment variables to terraform cloud
# Link: https://app.terraform.io/app/istm689-panel-management-system-org/workspaces
# Sensitive environment variables
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
provider "aws" {
  region = "us-east-1"
}

##########################
# Cloudflare Provider
##########################

# To make this provider work we added enviroment variables to terraform cloud
# Link: https://app.terraform.io/app/istm689-panel-management-system-org/workspaces
# Sensitive environment variable
# - CLOUDFLARE_API_TOKEN
