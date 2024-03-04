"""Main application file for the PMS Core API."""

import jwt
import boto3
import uuid
import pandas as pd
import numpy as np
from decimal import Decimal
from io import StringIO
from chalice import (
    Chalice,
    AuthResponse,
    CORSConfig,
    NotFoundError,
    BadRequestError,
    Response,
)
from chalicelib.config import (
    ENV,
    GOOGLE_AUTH_CLIENT_ID,
    ALLOW_ORIGIN,
    ALLOWED_AUTHORIZATION_TYPES,
    USER_TABLE_NAME,
    QUESTION_TABLE_NAME,
    PANEL_TABLE_NAME,
    JWT_SECRET,
    JWT_AUDIENCE,
    JWT_ISSUER,
    JWT_TOKEN_EXPIRATION_DAYS,
)
from chalicelib.constants import BOTO3_DYNAMODB_TYPE, REQUEST_CONTENT_TYPE_JSON
from chalicelib import db
from chalicelib.utils import (
    verify_token,
    get_token_subject,
    get_token_issuer,
    get_token_email,
    get_base_url,
    get_token_role
)
from google.auth import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime, timezone, timedelta
from jwt.exceptions import ExpiredSignatureError

app = Chalice(app_name=f"{ENV}-pms-core")
_USER_DB = None
_QUESTION_DB = None
_PANEL_DB = None

def get_user_db():
    global _USER_DB
    try:
        if _USER_DB is None:
            _USER_DB = db.DynamoUserDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(USER_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _USER_DB


def get_question_db():
    global _QUESTION_DB
    try:
        if _QUESTION_DB is None:
            _QUESTION_DB = db.DynamoQuestionDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(QUESTION_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _QUESTION_DB

def get_panel_db():
    global _PANEL_DB
    try:
        if _PANEL_DB is None:
            _PANEL_DB = db.DynamoPanelDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(PANEL_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _PANEL_DB

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
def token_authorizer(auth_request):
    """
    Lambda function to check authorization of incoming requests.
    """
    allowed_routes = []
    principal_id = "unspecified"
    try:
        # Expects token in the "Authorization" header of incoming request
        # ---> Format: "{"Authorization": "Bearer <token>"}"
        # Extract the token from the incoming request
        auth_header = auth_request.token.split()
        auth_token_type = auth_header[0]

        # Check if authorization type is valid
        if auth_token_type not in ALLOWED_AUTHORIZATION_TYPES:
            app.log.error(f"Invalid Authorization Header Type: {auth_token_type}")
            raise ValueError("Could not verify authorization type")

        # Extract the token from the authorization header
        token = auth_header[1]

        # We can check the token issuer for more security
        # token_issuer = get_token_issuer(token)
        # base_url = "http://localhost:8000"

        # # Only accepts own token. Not Google's token
        # if token_issuer != base_url:
        #     raise ValueError("Invalid Token Issuer")

        decoded_token = verify_token(token)

        if decoded_token is None:
            raise ValueError("Invalid or Expired Token")

        # At this point the token is valid and verified
        # Proceed to fetch user roles and match allowed routes

        allowed_routes.append("*")
        principal_id = get_token_subject(token)

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
    return {"API": app.app_name}


@app.route(
    "/token/create",
    methods=["POST"],
)
def create_token():
    """Need to recieive a token, decoded and return a new custom token with internal user ID"""
    user = None
    try:
        json_body = app.current_request.json_body
        incoming_token = json_body["token"]

        valid_and_verified_token = verify_token(incoming_token)

        if not valid_and_verified_token:
            raise ValueError("Invalid Token")

        # Need to validate the token subject?? It is not needed?
        token_issuer = get_token_issuer(incoming_token)

        if token_issuer != "https://accounts.google.com":
            raise ValueError("Invalid Token Issuer")
        token_subject = get_token_subject(incoming_token)

        users_found = get_user_db().get_user_by_google_id(token_subject)

        # Check if result was found
        if not users_found:
            user_email = get_token_email(incoming_token)
            users_found = get_user_db().get_user_by_email(user_email)
            user = users_found[0]
            # Add google ID to the register
            user["GoogleID"] = token_subject
            user["UpdatedAt"] = datetime.now().isoformat()
            # Update user
            get_user_db().update_user(user)

        # Does not have the updated items
        user = users_found[0]
        current_time = datetime.now(tz=timezone.utc)
        expiration = datetime.now(tz=timezone.utc) + timedelta(
            days=int(JWT_TOKEN_EXPIRATION_DAYS)
        )

        payload_data = {
            "iss": JWT_ISSUER,
            "aud": JWT_AUDIENCE,
            "iat": current_time,
            "nbf": current_time,
            "exp": expiration,
            "sub": user["UserID"],
            "email": user["EmailID"],
            "name": valid_and_verified_token["name"],
            "picture": valid_and_verified_token["picture"],
            "role": user["Role"],
        }

        token = jwt.encode(
            payload=payload_data,
            key=JWT_SECRET,
            algorithm="HS256",
        )
    except Exception:
        # Not always true but this is a Chalice Exception
        raise NotFoundError("User not found")

    return {"token": token}


@app.route("/token/decode", methods=["POST"])
def decode_token():
    try:
        json_body = app.current_request.json_body
        incoming_token = json_body["token"]
        decoded_token = verify_token(incoming_token)
        return {"decoded_token": decoded_token}

    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/question",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_all_questions():
    """
    Question route, testing purposes.
    """

    try:
        return get_question_db().list_questions()
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/question/{id}",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_question(id):
    """
    Question route, testing purposes.
    """
    item = get_question_db().get_question(question_id=id)
    if item is None:
        raise NotFoundError("Question (%s) not found" % id)
    return item


@app.route(
    "/question",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_new_question():
    """Question route, testing purposes."""
    try:
        """`app.current_request.json_body` works because the request has the header `Content-Type: application/json` set."""
        incoming_json = app.current_request.json_body

        # Check for all required fields
        if "question" not in incoming_json:
            raise BadRequestError("Key 'question' not found in incoming request")

        user_id = app.current_request.context["authorizer"]["principalId"]
        origin_ip = app.current_request.context["identity"]["sourceIp"]
        # Build Question object for database
        new_question = dict()
        new_question["QuestionID"] = str(uuid.uuid4())
        new_question["UserID"] = user_id
        new_question["OriginIP"] = origin_ip
        new_question["CreatedAt"] = datetime.now().isoformat()
        new_question["Question"] = incoming_json["question"]
        get_question_db().add_question(new_question)
        # Returns the result of put_item, kind of metadata and stuff
        return {
            "message": "Question successfully inserted in the DB",
            "QuestionID": new_question["QuestionID"],
        }

    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/user",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_all_users():
    """
    User route, testing purposes.
    """
    try:
        return get_user_db().list_users()
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/user/{id}",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_user(id):
    """
    User route, testing purposes.
    """
    item = get_user_db().get_user(user_id=id)
    if item is None:
        raise NotFoundError("User (%s) not found" % id)
    return item


@app.route(
    "/howdycsv",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=["text/plain"],
)
def post_howdy_csv():
    try:
        # Access the CSV file from the request body
        csv_data = app.current_request.raw_body.decode("utf-8")

        # Convert the CSV file to a string
        csv_file = StringIO(csv_data)

        # Read CSV data into a pandas dataframe
        df = pd.read_csv(csv_file)

        # Rename columns according to user table schema
        df.rename(
            columns={"FIRST NAME": "FName", "LAST NAME": "LName", "EMAIL": "EmailID"},
            inplace=True,
        )

        # Replace "email.tamu.edu" with just "tamu.edu" in the email column
        df["EmailID"] = df["EmailID"].str.replace("email.tamu.edu", "tamu.edu")

        # Choosing relevant columns for adding records to the user_db
        records = df[["EmailID", "FName", "LName", "UIN"]].to_dict(orient="records")
        for record in records:
            user_exists = get_user_db().get_user_by_uin(record["UIN"])

            if not user_exists:
                # If the user does not exists, create a new one from scratch
                new_user = dict()
                new_user["UserID"] = str(uuid.uuid4())
                new_user["EmailID"] = record["EmailID"]
                new_user["FName"] = record["FName"]
                new_user["LName"] = record["LName"]
                new_user["UIN"] = record["UIN"]
                new_user["Role"] = "student"
                new_user["CreatedAt"] = datetime.now().isoformat()
                new_user["UpdatedAt"] = datetime.now().isoformat()
                get_user_db().add_user(new_user)
            else:
                # The user already exists, should update some fields only
                updated_user = user_exists[0]
                updated_user["EmailID"] = record["EmailID"]
                updated_user["FName"] = record["FName"]
                updated_user["LName"] = record["LName"]
                updated_user["UpdatedAt"] = datetime.now().isoformat()
                get_user_db().update_user(updated_user)
        return Response(
            body={
                "message": f"Student data processed successfully with {len(df)} records"
            },
            status_code=200,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/canvascsv",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=["text/plain"],
)
def post_canvas_csv():
    try:
        # Access the CSV file from the request body
        csv_data = app.current_request.raw_body.decode("utf-8")

        # Convert the CSV file to a string
        csv_file = StringIO(csv_data)

        # Read CSV data into a pandas dataframe
        df = pd.read_csv(csv_file)

        # Rename columns according to user table schema
        df.rename(columns={"ID": "CanvasID", "SIS Login ID": "UIN"}, inplace=True)
        # Cleanup CanvasID NaN columns
        df["CanvasID"] = df["CanvasID"].replace("NaN", pd.NA).fillna(0).astype(int)
        # Cleanup UIN NaN columns
        df["UIN"] = df["UIN"].replace("NaN", pd.NA).fillna(0).astype(int)
        # Cleanup Section NaN columns
        df["Section"] = df["Section"].replace("NaN", "")
        # Remove rows with UIN = 0
        df = df[df["UIN"] != 0]

        # Choosing relevant columns for adding records to the user_db
        records = df[["CanvasID", "Section", "UIN"]].to_dict(orient="records")
        for record in records:
            user_exists = get_user_db().get_user_by_uin(record["UIN"])

            if not user_exists:
                # If the user does not exists, create a new one from scratch
                new_user = dict()
                new_user["UserID"] = str(uuid.uuid4())
                new_user["UIN"] = int(record["UIN"])
                new_user["Role"] = "student"
                new_user["Section"] = record["Section"]
                new_user["CanvasID"] = int(record["CanvasID"])
                new_user["CreatedAt"] = datetime.now().isoformat()
                new_user["UpdatedAt"] = datetime.now().isoformat()
                get_user_db().add_user(new_user)
            else:
                # The user already exists, should update some fields only
                updated_user = user_exists[0]
                updated_user["Section"] = record["Section"]
                updated_user["CanvasID"] = int(record["CanvasID"])
                updated_user["UpdatedAt"] = datetime.now().isoformat()
                get_user_db().update_user(updated_user)
        return Response(
            body={
                "message": f"Student data processed successfully with {len(df)} records"
            },
            status_code=200,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/user",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_new_user():
    """User route, testing purposes."""
    try:
        """`app.current_request.json_body` works because the request has the header `Content-Type: application/json` set."""
        incoming_json = app.current_request.json_body

        # Check for all required fields
        if "name" not in incoming_json:
            raise BadRequestError("Key 'name' not found in incoming request")
        if "lastname" not in incoming_json:
            raise BadRequestError("Key 'lastname' not found in incoming request")
        if "email" not in incoming_json:
            raise BadRequestError("Key 'email' not found in incoming request")

        # Fetch principalID (Google ID) from incoming request.
        # Not a real case scenario
        google_id = app.current_request.context["authorizer"]["principalId"]
        origin_ip = app.current_request.context["identity"]["sourceIp"]
        # Build User object for database
        new_user = dict()
        new_user["UserID"] = str(uuid.uuid4())
        new_user["GoogleID"] = google_id
        new_user["OriginIP"] = origin_ip
        new_user["CreatedAt"] = datetime.now().isoformat()
        new_user["Name"] = incoming_json["name"]
        new_user["LastName"] = incoming_json["lastname"]
        new_user["Email"] = incoming_json["email"]

        get_user_db().add_user(new_user)
        # Returns the result of put_item, kind of metadata and stuff

    except Exception as e:
        return {"error": str(e)}
    
@app.route(
    "/panel",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_panel_info():
    incoming_json = app.current_request.json_body

    """ check if truly the admin is sending the request """
    auth_header = app.current_request.headers.get('Authorization')    
    incoming_token = auth_header.split(' ')[1]
    if get_token_role(incoming_token) != "admin":
        raise BadRequestError("Only admin can perform this action")

    panel = {}
    
    try:
        # map json to panel object
        panel["PanelID"] = str(uuid.uuid4())
        panel["NumberOfQuestions"] = incoming_json["numberOfQuestions"]
        panel["PanelName"] = incoming_json["panelName"]
        panel["Panelist"] = incoming_json["panelist"]
        panel["QuestionStageDeadline"] = incoming_json["questionStageDeadline"]
        panel["VoteStageDeadline"] = incoming_json["voteStageDeadline"]
        panel["TagStageDeadline"] = incoming_json["tagStageDeadline"]
        panel["PanelVideoLink"] = incoming_json["panelVideoLink"]
        panel["PanelPresentationDate"] = incoming_json["panelPresentationDate"]
        panel["PanelDesc"] = incoming_json["panelDesc"]

        get_panel_db().add_panel(panel)

        return Response(
            body={"message": "Panel added successfully"},
            status_code=200,
            headers={"Content-Type": "application/json"},
            )
    except Exception as e:
        return {"error": str(e)}

@app.route(
    "/panel",
    methods=["GET"],
    authorizer=token_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_panel_info():
    try:
        return get_panel_db().get_all_panels()
    except Exception as e:
        return {"error": str(e)}