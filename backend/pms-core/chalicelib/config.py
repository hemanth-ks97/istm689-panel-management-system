"""Configuration file for the application. This file is used to set the environment variables"""

from os import environ
from .constants import AUTH_BEARER_TYPE, AUTH_BASIC_TYPE

# Fetches form enviroment variables or sets default local development values
ENV = environ.get("ENV", "local")
GOOGLE_AUTH_CLIENT_ID = environ.get(
    "GOOGLE_AUTH_CLIENT_ID",
    "370940936724-4qh7n4qh6vrgli6bsf3je6kbe2lsotef.apps.googleusercontent.com",
)
GOOGLE_RECAPTCHA_SECRET_KEY = environ.get(
    "GOOGLE_RECAPTCHA_SECRET_KEY", "6Lf3lIcpAAAAACFT-wrtXeX2Z3NMAQLT3pXHIENL"
)

ALLOW_ORIGIN = environ.get("ALLOW_ORIGIN", "http://localhost:3000")

# Can add more later, like basic auth for development purposes, etc
ALLOWED_AUTHORIZATION_TYPES = (AUTH_BEARER_TYPE, AUTH_BASIC_TYPE)

USER_TABLE_NAME = environ.get("DYNAMODB_USER_TABLE_NAME", "local-user")
QUESTION_TABLE_NAME = environ.get("DYNAMODB_QUESTION_TABLE_NAME", "local-question")
PANEL_TABLE_NAME = environ.get("DYNAMODB_PANEL_TABLE_NAME", "local-panel")
METRIC_TABLE_NAME = environ.get("DYNAMODB_METRIC_TABLE_NAME", "local-metric")

# JWT secret key
JWT_SECRET = environ.get("JWT_SECRET", "8iCGu6XmF1OyWoR9v4WZ3gMQnX9HW7Sk")
JWT_TOKEN_EXPIRATION_DAYS = environ.get("JWT_TOKEN_EXPIRATION_DAYS", "1")
# FIND BETTER VALUES FOR THESE TWO THINGS
JWT_AUDIENCE = f"{ENV}-pms-core"
JWT_ISSUER = f"{ENV}-pms-core"
