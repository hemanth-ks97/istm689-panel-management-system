"""Main application file for the PMS Core API."""

from collections import defaultdict

import requests
import boto3
import pandas as pd
from random import shuffle
from io import StringIO
from urllib.parse import quote

from chalice import (
    Chalice,
    AuthResponse,
    CORSConfig,
    NotFoundError,
    BadRequestError,
    Response,
)
from chalicelib.email import send_email
from chalicelib.config import (
    ENV,
    ALLOW_ORIGIN,
    ALLOWED_AUTHORIZATION_TYPES,
    USER_TABLE_NAME,
    QUESTION_TABLE_NAME,
    PANEL_TABLE_NAME,
    METRIC_TABLE_NAME,
    PANELS_BUCKET_NAME,
    GOOGLE_RECAPTCHA_SECRET_KEY,
)
from chalicelib.constants import (
    BOTO3_DYNAMODB_TYPE,
    REQUEST_CONTENT_TYPE_JSON,
    GOOGLE_RECAPTCHA_VERIFY_URL,
    ADMIN_ROLE,
    STUDENT_ROLE,
    PANELIST_ROLE,
    ADMIN_ROLE_AUTHORIZE_ROUTES,
    STUDENT_ROLE_AUTHORIZE_ROUTES,
    PANELIST_ROLE_AUTHORIZE_ROUTES,
)
from chalicelib import db
from chalicelib.utils import (
    verify_token,
    get_token_subject,
    create_token,
    dfs,
    upload_objects,
    get_s3_objects,
    generate_panel_id,
    generate_question_id,
    generate_user_id,
    get_current_time_utc,
)
from google.auth import exceptions
from datetime import datetime, timezone, timedelta


app = Chalice(app_name=f"{ENV}-pms-core")
_USER_DB = None
_QUESTION_DB = None
_PANEL_DB = None
_METRIC_DB = None


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


def get_metric_db():
    global _METRIC_DB
    try:
        if _METRIC_DB is None:
            _METRIC_DB = db.DynamoMetricDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(METRIC_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _METRIC_DB


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
    dummy_db.batch_write_item()
    # SES
    dummy_ses = boto3.client("ses")
    dummy_ses.send_email()
    # S3
    dummy_s3 = boto3.client("s3")
    dummy_s3.put_object()
    dummy_s3.get_object()
    # dummy_s3.download_file()
    # dummy_s3.list_objects_v2()
    # dummy_s3.get_bucket_location()


app.api.cors = CORSConfig(
    allow_origin=ALLOW_ORIGIN,
)


@app.authorizer()
def authorizers(auth_request):
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

        decoded_token = verify_token(token)

        if decoded_token is None:
            raise ValueError("Invalid or Expired Token")

        principal_id = get_token_subject(token)
        user_role = get_user_db().get_user_role(principal_id)

        if user_role == ADMIN_ROLE:
            allowed_routes = ADMIN_ROLE_AUTHORIZE_ROUTES
        elif user_role == STUDENT_ROLE:
            allowed_routes = STUDENT_ROLE_AUTHORIZE_ROUTES
        elif user_role == PANELIST_ROLE:
            allowed_routes = PANELIST_ROLE_AUTHORIZE_ROUTES

        # At this point the token is valid and verified
        # Proceed to fetch user roles and match allowed routes

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


"""Public endpoints"""


@app.route("/login/google", methods=["POST"], content_types=[REQUEST_CONTENT_TYPE_JSON])
def post_login_google():
    """Need to receive a token, decoded and return a new custom token with internal user ID"""

    try:
        json_body = app.current_request.json_body
        incoming_token = json_body["token"]

        valid_and_verified_token = verify_token(incoming_token)

        if not valid_and_verified_token:
            raise ValueError("Invalid Token")

        user_email = valid_and_verified_token["email"]

        users_found = get_user_db().get_user_by_email(user_email)

        # Check if result was found
        if not users_found:
            raise NotFoundError("User not found")

        user = users_found[0]

        # Create a new token with the user id
        new_token = create_token(
            user_id=user["UserID"],
            email_id=user["EmailID"],
            name=valid_and_verified_token["name"],
            picture=valid_and_verified_token["picture"],
            role=user["Role"],
        )

        # Register last login
        user["LastLogin"] = get_current_time_utc()
        get_user_db().update_user(user)
    except Exception:
        # Not always true but this is a Chalice Exception
        raise NotFoundError("User not found")

    return {"token": new_token}


@app.route("/login/panel", methods=["POST"], content_types=[REQUEST_CONTENT_TYPE_JSON])
def post_login_panel():
    incoming_json = app.current_request.json_body

    # Check for all required fields
    if "email" not in incoming_json:
        raise BadRequestError("Key 'email' not found in incoming request")
    if "token" not in incoming_json:
        raise BadRequestError("Key 'token' not found in incoming request")
    if "callerUrl" not in incoming_json:
        raise BadRequestError("Key 'callerUrl' not found in incoming request")

    # Validate reCaptcha token and get score
    params = {
        "response": incoming_json["token"],
        "secret": GOOGLE_RECAPTCHA_SECRET_KEY,
    }
    url = GOOGLE_RECAPTCHA_VERIFY_URL
    res = requests.post(url, params=params)
    response = res.json()

    if response["success"] is False:
        raise BadRequestError(response["error-codes"])

    panelist_email = incoming_json["email"]
    users = get_user_db().get_user_by_email(panelist_email)

    if not users:
        raise NotFoundError("User not found")

    user = users[0]

    if user["Role"] != PANELIST_ROLE:
        raise BadRequestError("User is not a panelist")

    url_safe_name = quote(f"{user['FName']} {user['LName']}")

    new_token = create_token(
        user_id=user["UserID"],
        email_id=user["EmailID"],
        name=f"{user['FName']} {user['LName']}",
        picture=f"https://eu.ui-avatars.com/api/?name={url_safe_name}",
        role=user["Role"],
    )

    caller_url = incoming_json["callerUrl"]

    login_link = f"{caller_url}/verify?token={new_token}"

    html_body = f"""
    Dear {user['FName']},
    <p>I hope this message finds you well. As requested, here is the link to log in to your account:</p>
    <p><a class='ulink' href='{login_link}' target='_blank' rel='noopener'>{login_link}</a></p>
    <p>If you have any questions or encounter any issues, please feel free to reach out to our support team at [Support Email].
    </p>Best regards,
    <br>
    The Panel Management System Team
    """

    text_body = (
        f"Please copy and paste this link in your browser to log in: {login_link}"
    )

    # If so, generate a token and send an email
    send_email(
        destination_addresses=["davidgomilliontest@gmail.com"],
        subject=f"Login URL for {user['FName']}",
        html_body=html_body,
        text_body=text_body,
    )

    # Register last login
    user["LastLogin"] = get_current_time_utc()
    get_user_db().update_user(user)

    return response


"""Authenticated endpoints"""

"""FILE ENDPOINTS"""


@app.route(
    "/file/howdy",
    methods=["POST"],
    authorizer=authorizers,
    content_types=["text/plain"],
)
def post_process_howdy_file():
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
                new_user["UserID"] = generate_user_id()
                new_user["EmailID"] = record["EmailID"]
                new_user["FName"] = record["FName"]
                new_user["LName"] = record["LName"]
                new_user["UIN"] = record["UIN"]
                new_user["Role"] = STUDENT_ROLE
                new_user["CreatedAt"] = get_current_time_utc()
                new_user["UpdatedAt"] = get_current_time_utc()

                get_user_db().add_user(new_user)
            else:
                # The user already exists, should update some fields only
                updated_user = user_exists[0]
                updated_user["EmailID"] = record["EmailID"]
                updated_user["FName"] = record["FName"]
                updated_user["LName"] = record["LName"]
                updated_user["UpdatedAt"] = get_current_time_utc()
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
    "/file/canvas",
    methods=["POST"],
    authorizer=authorizers,
    content_types=["text/plain"],
)
def post_process_canvas_file():
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
                new_user["UserID"] = generate_user_id()
                new_user["UIN"] = int(record["UIN"])
                new_user["Role"] = STUDENT_ROLE
                new_user["Section"] = record["Section"]
                new_user["CanvasID"] = int(record["CanvasID"])
                new_user["CreatedAt"] = get_current_time_utc()
                new_user["UpdatedAt"] = get_current_time_utc()

                get_user_db().add_user(new_user)
            else:
                # The user already exists, should update some fields only
                updated_user = user_exists[0]
                updated_user["Section"] = record["Section"]
                updated_user["CanvasID"] = int(record["CanvasID"])
                updated_user["UpdatedAt"] = get_current_time_utc()
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


"""USER ENDPOINTS"""


@app.route(
    "/user",
    methods=["GET"],
    authorizer=authorizers,
)
def get_users():
    """
    User route, testing purposes.
    """

    try:
        users = get_user_db().list_users()
    except Exception as e:
        return {"error": str(e)}
    return users


@app.route(
    "/user",
    methods=["POST"],
    authorizer=authorizers,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def post_user():
    try:
        incoming_json = app.current_request.json_body

        # Check for all required fields
        if "name" not in incoming_json:
            raise BadRequestError("Key 'name' not found in incoming request")
        if "lastname" not in incoming_json:
            raise BadRequestError("Key 'lastname' not found in incoming request")
        if "email" not in incoming_json:
            raise BadRequestError("Key 'email' not found in incoming request")
        if "role" not in incoming_json:
            raise BadRequestError("Key 'role' not found in incoming request")

        # Build User object for database
        new_user = {
            "UserID": generate_user_id(),
            "CreatedAt": get_current_time_utc(),
            "Name": incoming_json["name"],
            "LastName": incoming_json["lastname"],
            "Email": incoming_json["email"],
            "Role": incoming_json["role"],
        }

        get_user_db().add_user(new_user)
        # Returns the result of put_item, kind of metadata and stuff

    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/me",
    methods=["GET"],
    authorizer=authorizers,
)
def get_my_user():
    try:
        user_id = app.current_request.context["authorizer"]["principalId"]
        user = get_user_db().get_user(user_id=user_id)
    except Exception as e:
        return {"error": str(e)}
    return user


@app.route(
    "/user/{id}",
    methods=["GET"],
    authorizer=authorizers,
)
def get_user(id):
    """
    User route, testing purposes.
    """
    item = get_user_db().get_user(user_id=id)
    if item is None:
        raise NotFoundError(f"User {id} not found")
    return item


@app.route(
    "/user/{id}",
    methods=["PATCH"],
    content_types=[REQUEST_CONTENT_TYPE_JSON],
    authorizer=authorizers,
)
def patch_user(id):
    item = get_user_db().get_user(user_id=id)

    if item is None:
        raise NotFoundError(f"User {id} not found")

    updated_user = app.current_request.json_body

    response = get_user_db().update_user(updated_user)
    return response


@app.route(
    "/user/{id}/metrics",
    methods=["GET"],
    authorizer=authorizers,
)
def get_user_metrics(id):

    # Need to check
    # If you are a user, you can only request your grades!
    # if you are an admin, you get a free pass
    try:
        metrics = get_metric_db().get_metrics_by_user(id)
    except Exception as e:
        return {"error": str(e)}

    return metrics


"""QUESTION ENDPOINTS"""


@app.route(
    "/question",
    methods=["GET"],
    authorizer=authorizers,
)
def get_questions():
    """
    Question route, testing purposes.

    """

    try:
        questions = get_question_db().list_questions()
    except Exception as e:
        return {"error": str(e)}
    return questions


@app.route(
    "/question",
    methods=["POST"],
    authorizer=authorizers,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def post_question():
    """Question route, testing purposes."""
    try:
        """`app.current_request.json_body` works because the request has the header `Content-Type: application/json` set."""
        incoming_json = app.current_request.json_body
        # Check for all required fields
        if "question" not in incoming_json:
            raise BadRequestError("Key 'question' not found in incoming request")
        if "panelId" not in incoming_json:
            raise BadRequestError("Key 'panelId' not found in incoming request")

        user_id = app.current_request.context["authorizer"]["principalId"]

        # Validate if panel still acepts questions!!

        # Build Question object for database
        new_question = {
            "QuestionID": generate_question_id(),
            "UserID": user_id,
            "PanelID": incoming_json["panelId"],
            "QuestionText": incoming_json["question"],
            "CreatedAt": get_current_time_utc(),
            "DislikedBy": [],
            "LikedBy": [],
            "NeutralizedBy": [],
            "DislikeScore": -1,
            "FinalScore": -1,
            "LikeScore": -1,
            "NeutralScore": -1,
            "PresentationBonusScore": -1,
            "VotingStageBonusScore": -1,
        }
        get_question_db().add_question(new_question)
        # Returns the result of put_item, kind of metadata and stuff
        return {
            "message": "Question successfully inserted in the DB",
            "QuestionID": new_question["QuestionID"],
        }

    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/question/{id}",
    methods=["GET"],
    authorizer=authorizers,
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
    "/question/batch",
    methods=["POST"],
    authorizer=authorizers,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def post_question_batch():
    try:
        incoming_json = app.current_request.json_body
        # Check for all required fields
        if "panelId" not in incoming_json:
            raise BadRequestError("Key 'panelId' not found in incoming request")
        if "questions" not in incoming_json:
            raise BadRequestError("Key 'questions' not found in incoming request")
        if type(incoming_json["questions"]) is not list:
            raise BadRequestError("Key 'questions' should be a list")

        user_id = app.current_request.context["authorizer"]["principalId"]
        panel_id = incoming_json["panelId"]

        # Validate if panel still acepts questions!!

        panel = get_panel_db().get_panel(panel_id)
        if panel is None:
            raise NotFoundError("Panel (%s) not found" % panel_id)

        # Validate if panel still acepts questions!!
        present = datetime.now(timezone.utc)
        questions_deadline = datetime.fromisoformat(panel["QuestionStageDeadline"])

        print(present)
        print(questions_deadline)

        if present > questions_deadline:
            raise BadRequestError("Not anymore")

        raw_questions = incoming_json["questions"]

        new_questions = []
        for question in raw_questions:
            # Build Question object for database
            new_question = {
                "QuestionID": generate_question_id(),
                "UserID": user_id,
                "PanelID": incoming_json["panelId"],
                "QuestionText": question,
                "CreatedAt": get_current_time_utc(),
                "DislikedBy": [],
                "LikedBy": [],
                "NeutralizedBy": [],
                "DislikeScore": -1,
                "FinalScore": -1,
                "LikeScore": -1,
                "NeutralScore": -1,
                "PresentationBonusScore": -1,
                "VotingStageBonusScore": -1,
            }

            new_questions.append(new_question)

        get_question_db().add_questions_batch(new_questions)
        # Returns the result of put_item, kind of metadata and stuff
        return {
            "message": "Questions successfully inserted in the DB",
        }

    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/panel/{id}/tagging",
    methods=["POST"],
    authorizer=authorizers,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def post_question_tagging(id):
    # Request Format {"liked":["<id_1>", "<id_2>",..., "<id_n>"], "disliked":["<id_1>", "<id_2>",..., "<id_n>"], "flagged":["<id_1>", "<id_2>",..., "<id_n>"]}
    try:
        panel = get_panel_db().get_panel(id)
        if panel is None:
            raise BadRequestError("The panel id does not exist")
        if get_current_time_utc() > panel["TagStageDeadline"]:
            raise BadRequestError("The deadline for this task has passed")

        user_id = app.current_request.context["authorizer"]["principalId"]
        request = app.current_request.json_body

        if "liked" not in request:
            raise BadRequestError("Key 'liked' not found in incoming request")
        if type(request["liked"]) is not list:
            raise BadRequestError("Key 'liked' should be a list")
        if "disliked" not in request:
            raise BadRequestError("Key 'disliked' not found in incoming request")
        if type(request["disliked"]) is not list:
            raise BadRequestError("Key 'disliked' should be a list")
        if "flagged" not in request:
            raise BadRequestError("Key 'flagged' not found in incoming request")
        if type(request["flagged"]) is not list:
            raise BadRequestError("Key 'flagged' should be a list")

        liked_list, disliked_list, flagged_list = (
            request["liked"],
            request["disliked"],
            request["flagged"],
        )
        batch_update_request = {}

        for q_id in liked_list:
            question = get_question_db().get_question(q_id)
            if "LikedBy" in question:
                if user_id not in question["LikedBy"]:
                    if len(question["LikedBy"]) > 0:
                        question["LikedBy"].extend(user_id)
                    else:
                        question["LikedBy"].append(user_id)
            else:
                question["LikedBy"] = [user_id]
            batch_update_request[q_id] = question

        for q_id in disliked_list:
            question = (
                get_question_db().get_question(q_id)
                if q_id not in batch_update_request
                else batch_update_request[q_id]
            )
            if "DislikedBy" in question:
                if user_id not in question["DislikedBy"]:
                    if len(question["DislikedBy"]) > 0:
                        question["DislikedBy"].extend(user_id)
                    else:
                        question["DislikedBy"].append(user_id)
            else:
                question["DislikedBy"] = [user_id]
            batch_update_request[q_id] = question

        for q_id in flagged_list:
            question = (
                get_question_db().get_question(q_id)
                if q_id not in batch_update_request
                else batch_update_request[q_id]
            )
            if "FlaggedBy" in question:
                if user_id not in question["FlaggedBy"]:
                    if len(question["FlaggedBy"]) > 0:
                        question["FlaggedBy"].extend(user_id)
                    else:
                        question["FlaggedBy"].append(user_id)
            else:
                question["FlaggedBy"] = [user_id]
            batch_update_request[q_id] = question

        get_question_db().add_questions_batch(batch_update_request.values())

        return f"{len(liked_list)} questions liked\n{len(disliked_list)} questions disliked\n{len(flagged_list)} questions flagged !"
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/panel/{id}/mark_similar",
    methods=["POST"],
    authorizer=authorizers,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def post_question_mark_similar(id):
    # Request Format {"similar":["<id_1>", "<id_2>",..., "<id_n>"]}
    # for every question_id in the list, append to its "similar-to" lsit in the database with every other question_id
    try:
        panel = get_panel_db().get_panel(id)
        if panel is None:
            raise BadRequestError("The panel id does not exist")
        if get_current_time_utc() > panel["TagStageDeadline"]:
            raise BadRequestError("The deadline for this task has passed")

        request = app.current_request.json_body
        similar_list = request["similar"]
        similar_set = set(similar_list)

        for q_id in similar_set:
            question_obj = get_question_db().get_question(q_id)
            if not question_obj:
                raise BadRequestError("Invalid question_id", q_id)
            other_ids = similar_set.copy()
            other_ids.remove(q_id)
            if "SimilarTo" in question_obj:
                question_obj["SimilarTo"].extend(
                    uuid for uuid in other_ids if uuid not in question_obj["SimilarTo"]
                )
            else:
                question_obj["SimilarTo"] = list(other_ids)
            get_question_db().add_question(question_obj)

        return f"{len(similar_list)} questions marked as similar"
    except Exception as e:
        return {"error": str(e)}


"""PANEL ENDPOINTS"""


@app.route(
    "/panel",
    methods=["GET"],
    authorizer=authorizers,
)
def get_panels():
    try:
        user_id = app.current_request.context["authorizer"]["principalId"]
        user_role = get_user_db().get_user_role(user_id)

        if user_role == ADMIN_ROLE:
            panels = get_panel_db().get_all_panels()
        else:
            panels = get_panel_db().get_public_panels()

        # Check user role

    except Exception as e:
        return {"error": str(e)}

    return panels


@app.route(
    "/panel",
    methods=["POST"],
    authorizer=authorizers,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def post_panel():
    try:
        incoming_json = app.current_request.json_body

        new_panel = {
            "PanelID": generate_panel_id(),
            "NumberOfQuestions": incoming_json["numberOfQuestions"],
            "PanelName": incoming_json["panelName"],
            "Panelist": incoming_json["panelist"],
            "QuestionStageDeadline": incoming_json["questionStageDeadline"],
            "VoteStageDeadline": incoming_json["voteStageDeadline"],
            "TagStageDeadline": incoming_json["tagStageDeadline"],
            "PanelVideoLink": incoming_json["panelVideoLink"],
            "PanelPresentationDate": incoming_json["panelPresentationDate"],
            "PanelDesc": incoming_json["panelDesc"],
            "PanelStartDate": incoming_json["panelStartDate"],
            "Visibility": incoming_json["visibility"],
            "CreatedAt": get_current_time_utc(),
        }
        get_panel_db().add_panel(new_panel)

        # We don't know if we added the panel successfully
        return Response(
            body={"message": "Panel added successfully"},
            status_code=200,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/panel/{id}",
    methods=["GET"],
    authorizer=authorizers,
)
def get_panel(id):
    try:
        # Fetch user id
        user_id = app.current_request.context["authorizer"]["principalId"]
        user_role = get_user_db().get_user_role(user_id)
        panel = get_panel_db().get_panel(id)

        if user_role != ADMIN_ROLE and panel["Visibility"] == "internal":
            raise BadRequestError("Only admin can view this panel")

        return panel

    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/panel/{id}",
    methods=["PATCH"],
    content_types=[REQUEST_CONTENT_TYPE_JSON],
    authorizer=authorizers,
)
def patch_panel(id):

    item = get_panel_db().get_panel(panel_id=id)

    if item is None:
        raise NotFoundError(f"Panel {id} not found")

    updated_panel = app.current_request.json_body

    response = get_panel_db().update_panel(updated_panel)
    return response


@app.route(
    "/panel/{id}/distribute",
    methods=["GET"],
    authorizer=authorizers,
)
def distribute_tag_questions(id):
    try:
        # Get list of all questions for that panel from the usersDB
        questions = get_question_db().get_questions_by_panel(id)

        # Creating map to store questionID and corresponding userID
        question_map = {}

        # Get all questionIDs and corresponding UserID from questions
        for question in questions:
            question_id = question.get("QuestionID")
            user_id = question.get("UserID")
            question_text = question.get("QuestionText")
            question_map[question_id] = {
                "UserID": user_id,
                "QuestionText": question_text,
            }

        # Store all questionIDs from Map
        question_ids = list(question_map.keys())

        # Get total students from the usersDB
        student_ids = list(get_user_db().get_student_user_ids())
        number_of_questions_per_student = 10
        number_of_questions = len(question_ids)
        number_of_students = len(student_ids)
        number_of_question_slots = number_of_questions_per_student * number_of_students
        number_of_repetition_of_questions = (
            number_of_question_slots // number_of_questions
        )
        number_of_extra_question_slots = number_of_question_slots % number_of_questions

        # Print variable values
        print("Panel ID: ", id)
        print("Number of questions per student: ", number_of_questions_per_student)
        print("Total number of questions: ", number_of_questions)
        print("Total number of students: ", number_of_students)
        print("Total number of question slots: ", number_of_question_slots)
        print("Number of extra question slots: ", number_of_extra_question_slots)

        # Distribute questions to slots
        distributed_question_id_slots = []

        # Append each question id to the list with repetitions
        for question_id in question_ids:
            distributed_question_id_slots.extend(
                [question_id] * number_of_repetition_of_questions
            )

        # Fill remaining slots with top question ids and append to the list
        if number_of_extra_question_slots > 0:
            top_questions = question_ids[:number_of_extra_question_slots]
            distributed_question_id_slots.extend(top_questions)

        # Shuffle the question slots to randomize the order
        shuffle(distributed_question_id_slots)

        # Create a collection to store questionSubLists
        student_id_questions_map = {}

        for _ in range(number_of_students):
            student_id = student_ids.pop(0)

            # Create a sublist for each iteration
            question_id_text_map = {}

            # Pop questions from the questions slot list to put in the map
            for _ in range(number_of_questions_per_student):
                question_id = distributed_question_id_slots.pop(0)

                # Check if question exists in the map keys and check if question was entered by user
                while (question_id in question_id_text_map.keys()) or (
                    student_id == question_map[question_id]["UserID"]
                ):
                    # Append it to the end of the master list and fetch the next question
                    distributed_question_id_slots.append(question_id)

                    # Get next question from the questionID slot list
                    question_id = distributed_question_id_slots.pop(0)

                # Add question to map
                question_id_text_map[question_id] = question_map[question_id][
                    "QuestionText"
                ]

            # Assign the sublist to the next available student ID
            student_id_questions_map[student_id] = question_id_text_map

        # Add the student_question_map to an S3 bucket

        upload_objects(PANELS_BUCKET_NAME, id, student_id_questions_map)

        return student_id_questions_map
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/panel/{id}/questions",
    methods=["GET"],
    authorizer=authorizers,
)
def get_panel_questions(id):
    try:
        questions = get_question_db().get_questions_by_panel(id)
    except Exception as e:
        return {"error": str(e)}

    return questions


@app.route(
    "/panel/{id}/metrics",
    methods=["GET"],
    authorizer=authorizers,
)
def get_panel_metrics(id):
    # Need to check
    # Only for admins
    try:
        metrics = get_metric_db().get_metrics_by_panel(id)
    except Exception as e:
        return {"error": str(e)}

    return metrics


@app.route(
    "/metric",
    methods=["PATCH"],
    content_types=[REQUEST_CONTENT_TYPE_JSON],
    authorizer=authorizers,
)
def patch_metric():
    updated_metric = app.current_request.json_body

    # Check for all required fields
    if "PanelID" not in updated_metric:
        raise BadRequestError("Key 'PanelID' not found in incoming request")
    if "UserID" not in updated_metric:
        raise BadRequestError("Key 'UserID' not found in incoming request")

    item = get_metric_db().get_metric(
        user_id=updated_metric["UserID"], panel_id=updated_metric["PanelID"]
    )

    if item is None:
        raise NotFoundError(
            f"Metric for Panel {updated_metric['PanelID']} and User {updated_metric['UserID']}: not found"
        )

    response = get_metric_db().update_metric(updated_metric)
    return response


@app.route(
    "/panel/{id}/questions/group_similar",
    methods=["GET"],
    authorizer=authorizers,
)
def get_panel_(id):
    try:
        questions = get_question_db().get_questions_by_panel(id)

        # Build adjacency list {<q_id> : [q_id1, q_id2, ..., q_idn]} for every q_id present in panel_id
        adj_list = defaultdict(list)
        for question_obj in questions:
            if "SimilarTo" in question_obj:
                adj_list[question_obj["QuestionID"]] = question_obj["SimilarTo"]

        # Iterate through all questions and perform DFS
        similar_culsters = []
        visited = set()
        for question in questions:
            is_new, cluster = dfs(question["QuestionID"], visited, adj_list)
            if is_new:
                similar_culsters.append(cluster)

        # Build hash-map of retrieved questions for faster lookup
        question_map = {}
        for question_obj in questions:
            question_map[question_obj["QuestionID"]] = question_obj

        # Pick representative question from each cluster of similar questions (highest likes)
        # Exclude flagged questions
        # Calculate total cluster likes
        # store it in a new list

        rep_question_clusters = []

        for cluster in similar_culsters:
            rep_id = cluster[0]
            rep_likes = 0
            cluster_likes = 0
            cluster_dislikes = 0
            filtered_cluster = []

            if len(cluster) > 1:
                for q_id in cluster:
                    if (
                        "FlaggedBy" not in question_map[rep_id]
                        or len(question_map[q_id]["FlaggedBy"]) == 0
                    ):
                        filtered_cluster.append(q_id)
                        q_likes = len(question_map[q_id]["LikedBy"])
                        q_dislikes = len(question_map[q_id]["DislikedBy"])
                        if q_likes > rep_likes:
                            rep_id = q_id
                            rep_likes = q_likes
                        cluster_likes += q_likes
                        cluster_dislikes += q_dislikes
            else:
                if (
                    "FlaggedBy" not in question_map[rep_id]
                    or len(question_map[rep_id]["FlaggedBy"]) == 0
                ):
                    filtered_cluster.append(rep_id)

            if len(filtered_cluster) > 0:
                rep_question_clusters.append(
                    {
                        "rep_id": rep_id,
                        "cluster": filtered_cluster,
                        "cluster_likes": cluster_likes,
                        "cluster_dislikes": cluster_dislikes,
                    }
                )

        # Sort by cluster likes in descending order
        sorted_by_cluster_likes = sorted(
            rep_question_clusters, key=lambda x: x["cluster_likes"], reverse=True
        )

        # TODO - Store in panel-table or S3 bucket or Both

        return sorted_by_cluster_likes

    except Exception as e:
        return {"error": str(e)}


"""METRIC ENDPOINTS"""


@app.route(
    "/metric",
    methods=["GET"],
    authorizer=authorizers,
)
def get_all_metrics_():
    try:
        metrics = get_metric_db().list_metrics()
    except Exception as e:
        return {"error": str(e)}

    return metrics


@app.route(
    "/panel/{id}/questions/tagging",
    methods=["GET"],
    authorizer=authorizers,
)
def get_questions_per_student(id):
    panel_id = id
    user_question = None
    # Fetch user id
    user_id = app.current_request.context["authorizer"]["principalId"]

    if not panel_id or not user_id:
        return Response(body={"error": "Missing panelId or userId"}, status_code=400)

    object_key = f"{panel_id}/questions.json"

    # Check cache first!

    # if not cached
    #  - get s3 object
    #  - set cache with TTL
    #  - return object

    print(
        f"Getting questions for User ID: {user_id} from S3 Bucket Name: {PANELS_BUCKET_NAME} and object name: {object_key}"
    )
    questions_data, error = get_s3_objects(PANELS_BUCKET_NAME, object_key)

    if error:
        app.log.error(f"Error fetching from S3: {error}")
        return Response(
            body={"error": "Unable to fetch question data"}, status_code=500
        )

    if questions_data:
        user_question = questions_data.get(user_id)

    if user_question:
        return {"question": user_question}
    else:
        return Response(body={"error": "Question not found for user"}, status_code=404)
