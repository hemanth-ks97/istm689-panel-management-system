##################################################
# Terraform Project Outputs
##################################################

output "amplify_app_url" {
  value       = aws_amplify_domain_association.frontend-domain-association.domain_name
  description = "Domain name of the amplify app"
}
