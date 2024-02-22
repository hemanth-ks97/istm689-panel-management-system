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

import boto3
import uuid

app = Chalice(app_name=f"{ENV}-pms-core")
dynamodb = boto3.resource("dynamodb")


def dummy():
    """
    Collection of all functions that we need.
    The sole purpose is to force Chalice to generate the right permissions in the policy.
    Does nothing and returns nothing.
    """
    # DynamoDB
    dummy_db = boto3.client("dynamodb")
    dummy_db.get_item()
    dummy_db.put_item()
    dummy_db.update_item()
    dummy_db.scan()
    dummy_db.query()
    # S3
    # dummy_s3 = boto3.client("s3")
    # dummy_s3.put_object()
    # dummy_s3.download_file()
    # dummy_s3.get_object()
    # dummy_s3.list_objects_v2()
    # dummy_s3.get_bucket_location()


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
                # I'm thinking using panel@email.com:current-date
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

    # Workaround to force chalice to generate all policies
    # It never executes
    if False:
        dummy()
    return {"hello": "world"}


@app.route("/question", methods=["GET"])
def question_get():
    """Question route, testing purposes."""
    try:
        table = dynamodb.Table("joaquin-test-table")
        all_questions = table.scan()
        return all_questions["Items"]
    except Exception as e:
        return {"error": str(e)}


@app.route("/question", methods=["POST"])
def question_post():
    """Question route, testing purposes."""
    try:
        """`app.current_request.json_body` works because the request has the header `Content-Type: application/json` set."""
        incoming_json = app.current_request.json_body
        # Add mandatory field
        incoming_json["UserID"] = str(uuid.uuid4())
        table = dynamodb.Table("joaquin-test-table")
        new_question = table.put_item(Item=incoming_json)
        # Returns the result of put_item, kind of metadata and stuff
        return new_question
    except Exception as e:
        return {"error": str(e)}
