##################################################
# Terraform Project Variables
##################################################

##################################################
# AWS
##################################################

variable "amplify_app_repository" {
  description = "The repository of the Amplify app"
  type        = string
  default     = "https://github.com/JoaquinGimenez1/istm689-panel-management-system"
}

variable "budgets_budget_limit_amount" {
  description = "Budget limit amount for every enviroment"
  type = object({
    dev        = string
    production = string
  })
  default = {
    dev        = "10"
    production = "20"
  }
}

variable "dynamodb_table_read_capacity" {
  description = "Read Capacity limit for every enviroment"
  type = object({
    dev        = number
    production = number
  })
  default = {
    dev        = 1
    production = 1
  }
}

variable "dynamodb_table_write_capacity" {
  description = "Read Capacity limit for every enviroment"
  type = object({
    dev        = number
    production = number
  })
  default = {
    dev        = 1
    production = 1
  }
}

variable "dynamodb_global_secondary_idx_read_capacity" {
  description = "Read Capacity limit for every enviroment"
  type = object({
    dev        = number
    production = number
  })
  default = {
    dev        = 1
    production = 1
  }
}

variable "dynamodb_global_secondary_idx_write_capacity" {
  description = "Read Capacity limit for every enviroment"
  type = object({
    dev        = number
    production = number
  })
  default = {
    dev        = 1
    production = 1
  }
}

variable "amplify_branch_branch_name" {
  description = "Branch name for the webapp repo"
  type = object({
    dev        = string
    production = string
  })
  default = {
    dev        = "dev"
    production = "main"
  }
}

variable "amplify_domain_association_domain_name" {
  description = "Custom domain name for the webapp"
  type = object({
    dev        = string
    production = string
  })
  default = {
    dev        = "istm689-dev.joaquingimenez.com"
    production = "istm689.joaquingimenez.com"
  }
}

# TODO: After creating an API Gateway, we need to use the output values to determine de API URL.
# Similar to what we did for the DNS zone records
variable "amplify_branch_environment_variables_REACT_APP_API_BASE_URL" {
  description = "API URL for the webapp"
  type = object({
    dev        = string
    production = string
  })
  default = {
    dev        = "https://r23u758nsl.execute-api.us-east-1.amazonaws.com/dev/"
    production = "https://77v6036nsb.execute-api.us-east-1.amazonaws.com/production/"
  }
}

variable "aws_ses_identity_email" {
  description = "Email from which the messages will be sent"
  type = object({
    dev        = string
    production = string
  })
  default = {
    dev        = "davidgomilliontest@gmail.com"
    production = "davidgomilliontest@gmail.com"
  }
}

##################################################
# Cloudflare
##################################################

variable "cf_zone_id" {
  description = "DNS Zone ID from Cloudflare"
  type        = string
  default     = "2b0969f800003e0e97156368605bd575"
}

##################################################
# Terraform Cloud
##################################################

variable "TFC_CONFIGURATION_VERSION_GIT_TAG" {
  description = "Enviroment variable provided by Terraform Cloud"
}

variable "TF_VAR_GITHUB_TOKEN" {
  description = "Enviroment variable with access to the project repository"
  type        = string
  sensitive   = true
}


variable "amplify_branch_environment_variables_REACT_APP_GOOGLE_CLIENT_ID" {
  description = "Client ID for Google Sign-In for the webapp"
  type = object({
    dev        = string
    production = string
  })
  default = {
    dev        = "979252554614-0gjt8bjrpkht2n0le6uoo12nhs8pgrv3.apps.googleusercontent.com"
    production = "979252554614-r05g1fdg6unklck10sjnamb3701r0u88.apps.googleusercontent.com"
  }
}
# amplify_branch_environment_variables_REACT_APP_GOOGLE_RECAPTCHA_KEY
variable "amplify_branch_environment_variables_REACT_APP_GOOGLE_RECAPTCHA_KEY" {
  description = "Site Key for Google reCaptcha v3"
  type = object({
    dev        = string
    production = string
  })
  default = {
    dev        = "6LdJk4cpAAAAAMElljbKeYwljNSFD63BEJmt804E"
    production = "6LfnmocpAAAAACDze9K30nkB472UV0qnYVJPBbBu"
  }
}


