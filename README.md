# ISTM 689 Panel Managemet System
Monorepo for the Panel Management System project. This files contains basic information about the structure of the project and tools used by the Panel Management System.

- [ISTM 689 Panel Managemet System](#istm-689-panel-managemet-system)
  - [Project Structure](#project-structure)
  - [Setup](#setup)
    - [Initial setup from scratch](#initial-setup-from-scratch)

## Project Structure
This is a monorepo for the entire system and consists in three components
- Infrastructure as code (IaC) (terraform directory)
- Backend (backend directory)
- Web Application (webapp directory)

## Setup

### Initial setup from scratch

Requirements:
- AWS Account
- [Terraform Cloud](https://app.terraform.io/) account
- Code repository supported by Terraform Cloud
  - Currently supported developer platforms are: GitHub, GitLab, Bitbucket, Azure DevOps

In order to setup the project from zero we need to follow these steps: 
- Create a `terraform` IAM user
- Attach `AdministratorAccess` policy (or whatever you want to give it)
- Generate and store an access key (later to be used)
- Create a workspace and project on Terraform Cloud
- Link the project to the repository
- Add environment variables
  - To interact with AWS we need to set: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- To be completed