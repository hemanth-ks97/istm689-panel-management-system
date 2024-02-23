# ISTM 689 Panel Managemet System
Monorepo for the Panel Management System project. This files contains basic information about the structure of the project and tools used by the Panel Management System.

- [ISTM 689 Panel Managemet System](#istm-689-panel-managemet-system)
  - [Project Structure](#project-structure)
  - [Setup](#setup)
    - [Initial setup from scratch](#initial-setup-from-scratch)
  - [Developer Setup](#developer-setup)
    - [Requirements](#requirements)
    - [Run Frontend](#run-frontend)
    - [Run the Backend](#run-the-backend)

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
- Create two workspace and project on Terraform Cloud
  - This project **needs** `prod` and `dev` workspaces created
- Link the project to the repository
- Add environment variables
  - Note: Each workspace have isolated environment variables
  - To interact with AWS we need to set: 
    - `AWS_ACCESS_KEY_ID`: Access Key ID for the AWS user to be used by terraform
    - `AWS_SECRET_ACCESS_KEY`: Secret Access Key for the AWS user to be used by terraform
    - `TF_VAR_GITHUB_TOKEN`: Access token from GitHub with read-only access to the repository
    - `CLOUDFLARE_API_TOKEN` (optional): If we want to use a custom domain hosted on Cloudflare

## Developer Setup

### Requirements
Need to install the following dependencies
- Python 3.11.7
- Node v18.17.1
- AWS CLI

### Run Frontend
To run the frontend you need to run the following commands
```bash
# Move to webapp directory 
cd webapp
# Install node packages
npm install
# Run react development server
npm start
# It should open the default browser on http://localhost:3000
# Stop react development server
# Press Ctrl C
```

### Run the Backend 
To run the backend you need to run the following commands
```bash
# Move to backend project directory
cd backend/pms-core 
# Install python packages
pip install -r requirements.txt
# Run Chalice on local server
chalice local --stage local
# It should be ready to test queries on http://localhost:8000
# Stop Chalice local server
# Press Ctrl C
```