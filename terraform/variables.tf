# Project variables

# Cloudflare
variable "cf_zone_id" {
  type        = string
  default     = "2b0969f800003e0e97156368605bd575"
  description = "DNS Zone ID from Cloudflare"
}

# Terraform Cloud
variable "TFC_CONFIGURATION_VERSION_GIT_COMMIT_SHA" {
  description = "Enviroment variable provided by Terraform Cloud"
}

# AWS
variable "amplify_app_repository" {
  type        = string
  description = "The repository of the Amplify app"
  default     = "https://github.com/JoaquinGimenez1/istm689-panel-management-system"
}

# TF_VAR_amplify_app_oauth_token
variable "amplify_app_oauth_token" {
  type        = string
  description = "value"
#   default     = "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"
  sensitive = true
}