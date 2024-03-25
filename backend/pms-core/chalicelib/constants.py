"""File containing constant values."""

# Authorization Types
AUTH_BEARER_TYPE = "Bearer"
AUTH_BASIC_TYPE = "Basic"
# BOTO3 Resource Types
BOTO3_DYNAMODB_TYPE = "dynamodb"
BOTO3_SES_TYPE = "ses"
# Request Content Types
REQUEST_CONTENT_TYPE_JSON = "application/json"

ADMIN_ROLE = "admin"
STUDENT_ROLE = "student"
PANELIST_ROLE = "panelist"

GOOGLE_ISSUER = "https://accounts.google.com"

STUDENT_ROLE_AUTHORIZE_ROUTES = ["/panel", "/panel/*", "/question/batch", "/question/mark_similar", "/question/like/batch", "/question/flag/batch"]


ADMIN_ROLE_AUTHORIZE_ROUTES = [
    "/file",
    "/file/*",
    "/user",
    "/user/*",
    "/question",
    "/question/*",
    "/panel",
    "/panel/*",
    "/metric",
    "/metric/*",
]
PANELIST_ROLE_AUTHORIZE_ROUTES = ["/panelist", "/panelist/*"]

GOOGLE_RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
