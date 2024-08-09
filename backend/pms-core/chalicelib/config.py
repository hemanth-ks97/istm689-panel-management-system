"""Configuration file for the application. This file is used to set the environment variables"""

from os import environ
from .constants import AUTH_BEARER_TYPE, AUTH_BASIC_TYPE


# Fetches form enviroment variables or sets default local development values
ENV = environ.get("ENV", "local")
GOOGLE_AUTH_CLIENT_ID = environ.get(
    "GOOGLE_AUTH_CLIENT_ID"
)
GOOGLE_RECAPTCHA_SECRET_KEY = environ.get(
    "GOOGLE_RECAPTCHA_SECRET_KEY"
)

ALLOW_ORIGIN = environ.get("ALLOW_ORIGIN", "http://localhost:3000")

# Can add more later, like basic auth for development purposes, etc
ALLOWED_AUTHORIZATION_TYPES = (AUTH_BEARER_TYPE, AUTH_BASIC_TYPE)

USER_TABLE_NAME = environ.get("DYNAMODB_USER_TABLE_NAME", "local-user")
QUESTION_TABLE_NAME = environ.get("DYNAMODB_QUESTION_TABLE_NAME", "local-question")
PANEL_TABLE_NAME = environ.get("DYNAMODB_PANEL_TABLE_NAME", "local-panel")
METRIC_TABLE_NAME = environ.get("DYNAMODB_METRIC_TABLE_NAME", "local-metric")
LOG_TABLE_NAME = environ.get("DYNAMODB_LOG_TABLE_NAME", "local-log")
PANELS_BUCKET_NAME = environ.get(
    "S3_PANELS_BUCKET_NAME", "local-istm689-panels-students-data"
)

# Need to cast string to bool, it is weird in python but it works
SES_IS_SANDBOX = (
    True
    if environ.get("SES_IS_SANDBOX_ENVIROMENT", "true").lower() == "true"
    else False
)

SES_EMAIL_ADDRESS = environ.get(
    "SES_EMAIL_ADDRESS_IDENTITY"
)

JWT_SECRET = environ.get("JWT_SECRET")

# JWT secret key
JWT_SECRET = environ.get("JWT_SECRET")
JWT_TOKEN_EXPIRATION_DAYS = int(environ.get("JWT_TOKEN_EXPIRATION_DAYS", "1"))

# FIND BETTER VALUES FOR THESE TWO THINGS
JWT_AUDIENCE = f"{ENV}-pms-core"
JWT_ISSUER = f"{ENV}-pms-core"
