##################################################
# Terraform Project Variables
##################################################

##################################################
# AWS
##################################################

variable "amplify_app_repository" {
  type        = string
  description = "The repository of the Amplify app"
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
variable "amplify_branch_environment_variables_REACT_APP_API_SERVER" {
  description = "API URL for the webapp"
  type = object({
    dev        = string
    production = string
  })
  default = {
    dev        = "https://api-dev.example.com"
    production = "https://api.example.com"
  }
}

##################################################
# Cloudflare
##################################################

variable "cf_zone_id" {
  type        = string
  default     = "2b0969f800003e0e97156368605bd575"
  description = "DNS Zone ID from Cloudflare"
}

##################################################
# Terraform Cloud
##################################################

variable "TFC_CONFIGURATION_VERSION_GIT_TAG" {
  description = "Enviroment variable provided by Terraform Cloud"
}

variable "TF_VAR_GITHUB_TOKEN" {
  type        = string
  description = "Enviroment variable with access to the project repository"
  sensitive   = true
}


variable "amplify_branch_environment_variables_REACT_APP_GOOGLE_CLIENT_ID" {
  description = "Client ID for Google Sign-In for the webapp"
  type = object({
    dev        = string
    production = string
  })
  default = {
    dev        = "370940936724-4qh7n4qh6vrgli6bsf3je6kbe2lsotef.apps.googleusercontent.com"
    production = "TODO"
  }
}



