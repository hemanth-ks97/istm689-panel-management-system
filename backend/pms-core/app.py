"""Main application file for the PMS Core API."""

from chalice import Chalice, AuthResponse, CORSConfig
from chalicelib.config import (
    ENV,
    GOOGLE_AUTH_CLIENT_ID,
    ALLOW_ORIGIN,
    ALLOWED_AUTHORIZATION_TYPES,
)
from chalicelib.constants import BEARER_TYPE, BASIC_TYPE
from google.auth import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests

app = Chalice(app_name=f"{ENV}-pms-core")


app.api.cors = CORSConfig(
    allow_origin=ALLOW_ORIGIN,
)


@app.authorizer()
def google_oauth2_authorizer(auth_request):
    """Lambda function to check authorization of incoming requests."""
    allowed_routes = []
    principal_id = "unspecified"
    try:
        # Expects token in the "Authorization" header of incoming request
        # ---> Format: "{"Authorization": "Bearer <token>"}"
        # ---> Format: "{"Authorization": "Basic <token>"}"
        # Extract the token from the incoming request
        auth_header = auth_request.token.split()
        auth_token_type = auth_header[0]
        # Check if authorization type is valid
        if auth_token_type not in ALLOWED_AUTHORIZATION_TYPES:
            app.log.error(f"Invalid Authorization Header Type: {auth_token_type}")
            raise ValueError("Could not verify authorization type")
        # Extract the token from the authorization header
        token = auth_header[1]

        match auth_token_type:
            case "Bearer":
                request = requests.Request()
                # Validate the JWT token using Google's OAuth2 v2 API
                id_info = id_token.verify_oauth2_token(
                    token, request, GOOGLE_AUTH_CLIENT_ID
                )
                allowed_routes.append("*")
                principal_id = id_info["sub"]

            case "Basic":
                # Decode Basic token and return allowed routes
                pass
            case _:
                raise ValueError("Invalid Authorization Header Type")

    except exceptions.GoogleAuthError as e:
        # Token is invalid
        app.log.error(f"Google Auth Error: {str(e)}")
    except Exception as e:
        # General catch statement for unexpected errors
        app.log.error(f"Unexpected Error: {str(e)}")
    # Single return for all cases
    return AuthResponse(routes=allowed_routes, principal_id=principal_id)


@app.route("/")
def index():
    """Index route, only for testing purposes."""
    return {"hello": "world"}


@app.route("/protected", authorizer=google_oauth2_authorizer)
def protected():
    """Protected route, needs to have a valid and verified Google oAuth2 token before executing."""
    return {"hello": "from protected world"}


@app.route("/users", methods=["GET"], authorizer=google_oauth2_authorizer)
def users():
    """Users route, testing purposes."""
    return {
        "users": [
            {"name": "Test", "id": "test@test.com"},
            {"name": "Test 2", "id": "test2@test.com"},
        ]
    }


@app.route("/panel", methods=["GET"], authorizer=google_oauth2_authorizer)
def panel():
    """Panel route, testing purposes."""
    return {
        "panel": [{"name": "Panel 1", "id": "001"}, {"name": "Panel 2", "id": "002"}]
    }
