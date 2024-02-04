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

variable "TFC_CONFIGURATION_VERSION_GIT_COMMIT_SHA" {
  description = "Enviroment variable provided by Terraform Cloud"
}

variable "TF_VAR_GITHUB_TOKEN" {
  type        = string
  description = "Enviroment variable with access to the project repository"
  sensitive   = true
}