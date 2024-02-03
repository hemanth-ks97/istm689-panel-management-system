# Terraform

Terraform is an infrastructure as code tool that enables you to safely and predictably provision and manage infrastructure in any cloud. [Source](https://www.terraform.io/)

- [Terraform](#terraform)
  - [Organization](#organization)
  - [Project](#project)
  - [Workspaces](#workspaces)
    - [prod](#prod)
    - [dev](#dev)
  - [Limitations](#limitations)
  - [Account](#account)

## Organization
Name of the Terraform Cloud organization: `istm689-panel-management-system-org`. [Link](https://app.terraform.io/app/istm689-panel-management-system-org/workspaces)

We should be able to add team members to this organization and the can check the code

## Project
Name of the Terrafrom Cloud project: `Panel Management System`

Project is just a logical way to organize the different workspaces for a project within the organization. One organizaation can have different projects with different workspaces each.

## Workspaces
We have two different workspaces for this project because we want to manage two different enviroments, one for production and the other for development. Creating workspaces allows us to write code only once and fine tune the resoruces with variables depending on the workspace. 

For example, if we need to provision an EC2 instance for production and development we might not need the same instance type for both. We can have the development enviroment running with a `t2.nano` instance but the production one with `t2.large`.

### prod
Production workspace

Access key (Access Key 1 on console) to create and manage AWS resources in this workspace was created by the terraform user on the AWS account `590183759964` (registered to joaquin.gimenez@tamu.edu)

### dev
Production workspace

Access key (Access Key 2 on console) to create and manage AWS resources in this workspace was created by the terraform user on the AWS account `590183759964` (registered to joaquin.gimenez@tamu.edu)

## Limitations
The free tier can be used to manage 500 resources across the entire account. It also allows to have up to 5 different users to join the team.

## Account
The account associated with Terraform Cloud is joaquin.gimenez@tamu.edu.
