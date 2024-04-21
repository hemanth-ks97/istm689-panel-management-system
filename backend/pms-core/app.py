"""Main application file for the PMS Core API."""

from decimal import Decimal
import requests
import boto3
import pandas as pd
import numpy as np
from io import StringIO
from urllib.parse import quote

from chalice import (
    Chalice,
    CORSConfig,
    Response,
    Cron,
    AuthResponse,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    TooManyRequestsError,
    ChaliceViewError,
)

# BadRequestError,- returns a status code of 400
# UnauthorizedError,- returns a status code of 401
# ForbiddenError,- returns a status code of 403
# NotFoundError,- returns a status code of 404
# ConflictError,- returns a status code of 409
# TooManyRequestsError,- returns a status code of 429
# ChaliceViewError,- returns a status code of 500


from chalicelib.email import send_email
from chalicelib.config import (
    ENV,
    ALLOW_ORIGIN,
    ALLOWED_AUTHORIZATION_TYPES,
    PANELS_BUCKET_NAME,
    GOOGLE_RECAPTCHA_SECRET_KEY,
    SES_EMAIL_ADDRESS,
)
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    GOOGLE_RECAPTCHA_VERIFY_URL,
    ADMIN_ROLE,
    STUDENT_ROLE,
    PANELIST_ROLE,
    ADMIN_ROLE_AUTHORIZE_ROUTES,
    STUDENT_ROLE_AUTHORIZE_ROUTES,
    PANELIST_ROLE_AUTHORIZE_ROUTES,
    submit_score,
)

from chalicelib.utils import (
    verify_token,
    get_token_subject,
    create_token,
    get_s3_objects,
    generate_panel_id,
    generate_question_id,
    generate_user_id,
    generate_log_id,
    get_current_time_utc,
    distribute_tag_questions,
    group_similar_questions,
    grading_script,
    generate_final_question_list,
)
from google.auth import exceptions
from datetime import datetime, timezone, timedelta

from chalicelib.database.db_provider import (
    get_user_db,
    get_question_db,
    get_panel_db,
    get_metric_db,
    get_log_db,
)

app = Chalice(app_name=f"{ENV}-pms-core")


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

        source_ip = app.current_request.context["identity"]["sourceIp"]
        user_agent = app.current_request.headers["user-agent"]
        path = app.current_request.path

        valid_and_verified_token = verify_token(incoming_token)

        if not valid_and_verified_token:
            new_log = {
                "LogID": generate_log_id(),
                "SourceIP": source_ip,
                "UserAgent": user_agent,
                "Action": path,
                "Result": "Token not valid or verified",
                "CreatedAt": get_current_time_utc(),
            }
            get_log_db().add_log(new_log)
            raise ValueError("Invalid Token")

        user_email = valid_and_verified_token["email"]

        users_found = get_user_db().get_user_by_email(user_email)

        # Check if result was found
        if not users_found:
            new_log = {
                "LogID": generate_log_id(),
                "EmailID": user_email,
                "SourceIP": source_ip,
                "UserAgent": user_agent,
                "Action": path,
                "Result": "User not found in the database",
                "CreatedAt": get_current_time_utc(),
            }
            get_log_db().add_log(new_log)
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

    new_log = {
        "LogID": generate_log_id(),
        "UserID": user["UserID"],
        "UserFName": user["FName"],
        "UserLName": user["LName"],
        "SourceIP": source_ip,
        "UserAgent": user_agent,
        "Action": path,
        "Result": "User logged in successfully",
        "CreatedAt": get_current_time_utc(),
    }
    get_log_db().add_log(new_log)
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

    panelist_email = incoming_json["email"]
    source_ip = app.current_request.context["identity"]["sourceIp"]
    user_agent = app.current_request.headers["user-agent"]
    path = app.current_request.path

    if response["success"] is False:
        new_log = {
            "LogID": generate_log_id(),
            "EmailID": panelist_email,
            "SourceIP": source_ip,
            "UserAgent": user_agent,
            "Action": path,
            "Result": "reCaptcha validation failed",
            "CreatedAt": get_current_time_utc(),
        }
        get_log_db().add_log(new_log)
        raise BadRequestError(response["error-codes"])

    users = get_user_db().get_user_by_email(panelist_email)

    if not users:
        new_log = {
            "LogID": generate_log_id(),
            "EmailID": panelist_email,
            "SourceIP": source_ip,
            "UserAgent": user_agent,
            "Action": path,
            "Result": "Email not found",
            "CreatedAt": get_current_time_utc(),
        }
        get_log_db().add_log(new_log)
        raise NotFoundError("User not found")

    user = users[0]

    if user["Role"] != PANELIST_ROLE:
        new_log = {
            "LogID": generate_log_id(),
            "EmailID": panelist_email,
            "SourceIP": source_ip,
            "UserAgent": user_agent,
            "Action": path,
            "Result": "Email is not a panelist",
            "CreatedAt": get_current_time_utc(),
        }
        get_log_db().add_log(new_log)
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
        destination_addresses=[panelist_email],
        subject=f"Login URL for {user['FName']}",
        html_body=html_body,
        text_body=text_body,
    )

    # Register last login
    user["LastLogin"] = get_current_time_utc()
    get_user_db().update_user(user)

    new_log = {
        "LogID": generate_log_id(),
        "EmailID": panelist_email,
        "SourceIP": source_ip,
        "UserAgent": user_agent,
        "Action": path,
        "Result": "Panelist successfully logged in",
        "CreatedAt": get_current_time_utc(),
    }
    get_log_db().add_log(new_log)

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
        if "EmailID" not in incoming_json:
            raise BadRequestError("Key 'EmailID' not found in incoming request")
        if "FName" not in incoming_json:
            raise BadRequestError("Key 'FName' not found in incoming request")
        if "LName" not in incoming_json:
            raise BadRequestError("Key 'LName' not found in incoming request")
        if "Role" not in incoming_json:
            raise BadRequestError("Key 'Role' not found in incoming request")
        if "UIN" not in incoming_json:
            raise BadRequestError("Key 'UIN' not found in incoming request")
        if "CanvasID" not in incoming_json:
            raise BadRequestError("Key 'CanvasID' not found in incoming request")
        if "Section" not in incoming_json:
            raise BadRequestError("Key 'Section' not found in incoming request")

        new_id = generate_user_id()
        # Build User object for database
        new_user = {
            "UserID": new_id,
            "CreatedAt": get_current_time_utc(),
            "FName": incoming_json["FName"],
            "LName": incoming_json["LName"],
            "EmailID": incoming_json["EmailID"],
            "Role": incoming_json["Role"],
            "UIN": incoming_json["UIN"],
            "CanvasID": incoming_json["CanvasID"],
            "Section": incoming_json["Section"],
        }

        get_user_db().add_user(new_user)
        return {"UserID": new_id}

    except Exception as e:
        raise BadRequestError("Something went wrong")


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
    "/my/metrics",
    methods=["GET"],
    authorizer=authorizers,
)
def get_my_metrics():
    try:
        user_id = app.current_request.context["authorizer"]["principalId"]

        public_panels = get_panel_db().get_public_panels()
        metrics = []

        for panel in public_panels:
            metric = get_metric_db().get_metric(
                user_id=user_id, panel_id=panel["PanelID"]
            )
            if metric is not None:
                metrics.append(metric)

    except Exception as e:
        raise ChaliceViewError("Could not get metrics for user")

    return metrics


@app.route(
    "/user/{id}/metrics",
    methods=["GET"],
    authorizer=authorizers,
)
def get_metrics(id):
    # Need to check
    # If you are a user, you can only request your grades!
    # if you are an admin, you get a free pass
    try:
        metrics = get_metric_db().get_metrics_by_user(id)
    except Exception as e:
        raise ChaliceViewError("Could not get metrics for user")

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

        panel = get_panel_db().get_panel(panel_id)
        if panel is None:
            raise NotFoundError("Panel (%s) not found" % panel_id)

        # Validate if panel still acepts questions!!
        present = datetime.now(timezone.utc)
        questions_deadline = datetime.fromisoformat(panel["QuestionStageDeadline"])

        if present > questions_deadline:
            raise BadRequestError("Action not allowed anymore")

        raw_questions = incoming_json["questions"]

        new_questions = []
        for question in raw_questions:
            # Remove unnecessary spaces
            stripped_question = question.strip()
            # Build Question object for database
            if stripped_question == "":
                # If the question is empty, do not store it
                continue
            new_question = {
                "QuestionID": generate_question_id(),
                "UserID": user_id,
                "PanelID": incoming_json["panelId"],
                "QuestionText": stripped_question,
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

        pretty_time = datetime.now(timezone.utc).strftime("%m/%d/%Y at %H:%M:%S UTC")

        panel_name = panel["PanelName"]
        questions_requested = panel["NumberOfQuestions"]
        questions_deadline_pretty = questions_deadline.strftime(
            "%m/%d/%Y at %H:%M:%S UTC"
        )

        html_body = "<h4>Questions Submitted Successfully</h4>"
        html_body += "<p>Thank you for submitting your questions. We appreciate your engagement.</p>"
        html_body += "<p>Submission details:</p>"
        html_body += "<ul>"
        html_body += f"<li>{panel_name}</li>"
        html_body += f"<li>Number of questions submitted: {len(new_questions)}</li>"
        html_body += f"<li>Number of questions requested: {questions_requested}</li>"
        html_body += f"<li>Submission: {pretty_time}</li>"
        html_body += f"<li>Deadline: {questions_deadline_pretty}</li>"
        html_body += "</ul>"
        html_body += "<p>Remember that your questions will be reviewed.</p>"
        html_body += "<p>Best regards,<br/>"
        html_body += "Panel-G team</p>"

        student_email = get_user_db().get_user(user_id).get("EmailID")

        # Returns the result of put_item, kind of metadata and stuff
        send_email(
            destination_addresses=[student_email],
            subject="Questions submitted",
            html_body=html_body,
        )

        # #Check if all questions have been submitted
        no_of_questions = get_panel_db().get_number_of_questions_by_panel_id(panel_id)
        # Add score to metrics
        if no_of_questions == len(new_questions):
            metric_for_submit = {
                "UserID": user_id,
                "PanelID": panel_id,
                "EnteredQuestionsTotalScore": Decimal(submit_score),
            }
        else:
            sub_score_for_questions = round(
                (len(new_questions) / no_of_questions[0]) * submit_score
            )
            metric_for_submit = {
                "UserID": user_id,
                "PanelID": panel_id,
                "EnteredQuestionsTotalScore": Decimal(sub_score_for_questions),
            }
        get_metric_db().add_metric(metric_for_submit)

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
        user_id = app.current_request.context["authorizer"]["principalId"]
        panel_id = id
        request = app.current_request.json_body

        # Validation first because it is `cheaper` than querying the database
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

        panel = get_panel_db().get_panel(id)
        if panel is None:
            raise BadRequestError("The panel id does not exist")
        if get_current_time_utc() > panel["TagStageDeadline"]:
            raise BadRequestError("The deadline for this task has passed")

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

        html_body = "<h4>Question flagged</h4>"

        html_body += f"<p>{panel['PanelName']}</p>"
        html_body += "<ul>"
        for question_id in flagged_list:
            flagged_question = get_question_db().get_question(question_id)
            flagged_user = get_user_db().get_user(flagged_question["UserID"])
            html_body += f"<li>Question ID: {flagged_question['QuestionID']}</li>"
            html_body += "<ul>"

            html_body += f"<li>Text: {flagged_question['QuestionText']}</li>"
            html_body += (
                f"<li>Author: {flagged_user['LName']}, {flagged_user['FName']}</li>"
            )
            html_body += (
                f"<li>Flagged by count: {len(flagged_question['FlaggedBy'])}</li>"
            )
            html_body += "</ul>"

        html_body += "</ul>"
        if len(flagged_list) > 0:
            admins = get_user_db().get_users_by_role(ADMIN_ROLE)
            admin_addresses = []
            for admin in admins:
                admin_addresses.append(admin["EmailID"])

            send_email(
                destination_addresses=[SES_EMAIL_ADDRESS],
                bcc_addresses=admin_addresses,
                subject="PANEL-G: Questions flagged!",
                html_body=html_body,
            )

        # Adding total interactions and storing it in metrics table
        total_interactions = len(liked_list) + len(disliked_list) + len(flagged_list)

        # Add total_interactions, and out_time to metrics db
        student_metrics = get_metric_db().get_metric(user_id, panel_id)
        student_metrics["TagStageOutTime"] = get_current_time_utc()
        student_metrics["TagStageInteractions"] = total_interactions

        get_metric_db().add_metric(student_metrics)

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
    # Request Format {"similar":[["<id_1>", "<id_2>",..., "<id_n>"], [], []]}
    # for every question_id in the list, append to its "similar-to" lsit in the database with every other question_id
    try:
        panel_id = id
        user_id = app.current_request.context["authorizer"]["principalId"]
        panel = get_panel_db().get_panel(id)
        request = app.current_request.json_body

        present = datetime.now(timezone.utc)
        tagging_deadline = datetime.fromisoformat(panel["TagStageDeadline"])

        if panel is None:
            raise BadRequestError("The panel id does not exist")
        if present > tagging_deadline:
            raise BadRequestError("The deadline for this task has passed")
        if "similar" not in request:
            raise BadRequestError("Incorrect Request Format: missing key - 'similar'")

        similar_list = request["similar"]

        for similar_subset in similar_list:
            similar_set = set(similar_subset)
            for q_id in similar_set:
                question_obj = get_question_db().get_question(q_id)
                if not question_obj:
                    raise BadRequestError("Invalid question_id", q_id)
                other_ids = similar_set.copy()
                other_ids.remove(q_id)
                if "SimilarTo" in question_obj:
                    question_obj["SimilarTo"].extend(
                        uuid
                        for uuid in other_ids
                        if uuid not in question_obj["SimilarTo"]
                    )
                else:
                    question_obj["SimilarTo"] = list(other_ids)
                get_question_db().add_question(question_obj)

        # Adding tag-stage out time
        student_metrics = get_metric_db().get_metric(user_id, panel_id)
        student_metrics["TagStageOutTime"] = get_current_time_utc()
        get_metric_db().add_metric(student_metrics)

        panel_name = panel.get("PanelName")
        pretty_time = datetime.now(timezone.utc).strftime("%m/%d/%Y at %H:%M:%S UTC")

        html_body = "<h4>Questions Tagging Completed Successfully</h4>"
        html_body += "<p>Thank you for tagging the questions assigned to you. We appreciate your engagement.</p>"
        html_body += "<p>Submission details:</p>"
        html_body += "<ul>"
        html_body += f"<li>{panel_name}</li>"
        html_body += f"<li>Submission: {pretty_time}</li>"
        html_body += "</ul>"
        html_body += "<p>Best regards,<br/>"
        html_body += "PANEL-G team</p>"

        student_email = get_user_db().get_user(user_id).get("EmailID")

        # Returns the result of put_item, kind of metadata and stuff
        send_email(
            destination_addresses=[student_email],
            subject="Questions tagged",
            html_body=html_body,
        )

        return f"{len(similar_list)} sets of questions marked as similar"
    except Exception as e:
        return Response(body={"error": str(e)}, status_code=500)


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

        if "PanelName" not in incoming_json:
            raise BadRequestError("Key 'PanelName' not found in incoming request")
        if "Panelist" not in incoming_json:
            raise BadRequestError("Key 'Panelist' not found in incoming request")
        if "NumberOfQuestions" not in incoming_json:
            raise BadRequestError(
                "Key 'NumberOfQuestions' not found in incoming request"
            )
        if "QuestionStageDeadline" not in incoming_json:
            raise BadRequestError(
                "Key 'QuestionStageDeadline' not found in incoming request"
            )
        if "VoteStageDeadline" not in incoming_json:
            raise BadRequestError(
                "Key 'VoteStageDeadline' not found in incoming request"
            )
        if "TagStageDeadline" not in incoming_json:
            raise BadRequestError(
                "Key 'TagStageDeadline' not found in incoming request"
            )
        if "PanelVideoLink" not in incoming_json:
            raise BadRequestError("Key 'PanelVideoLink' not found in incoming request")
        if "PanelPresentationDate" not in incoming_json:
            raise BadRequestError(
                "Key 'PanelPresentationDate' not found in incoming request"
            )
        if "PanelDesc" not in incoming_json:
            raise BadRequestError("Key 'PanelDesc' not found in incoming request")
        if "Visibility" not in incoming_json:
            raise BadRequestError("Key 'Visibility' not found in incoming request")
        if "PanelStartDate" not in incoming_json:
            raise BadRequestError("Key 'PanelStartDate' not found in incoming request")

        new_panel_id = generate_panel_id()
        new_panel = {
            "PanelID": new_panel_id,
            "PanelName": incoming_json["PanelName"],
            "PanelDesc": incoming_json["PanelDesc"],
            "Panelist": incoming_json["Panelist"],
            "PanelStartDate": incoming_json["PanelStartDate"],
            "QuestionStageDeadline": incoming_json["QuestionStageDeadline"],
            "TagStageDeadline": incoming_json["TagStageDeadline"],
            "VoteStageDeadline": incoming_json["VoteStageDeadline"],
            "PanelPresentationDate": incoming_json["PanelPresentationDate"],
            "NumberOfQuestions": incoming_json["NumberOfQuestions"],
            "PanelVideoLink": incoming_json["PanelVideoLink"],
            "Visibility": incoming_json["Visibility"],
            "CreatedAt": get_current_time_utc(),
        }
        get_panel_db().add_panel(new_panel)

        students = []
        students = get_user_db().get_users_by_role(STUDENT_ROLE)
        new_metrics = []
        for student in students:
            try:
                new_metric = {
                    "UserID": student["UserID"],
                    "PanelID": new_panel_id,
                    "UserCanvasID": Decimal(student["CanvasID"]),
                    "UserUIN": Decimal(student["UIN"]),
                    "UserSection": student["Section"],
                    "UserFName": student["FName"],
                    "UserLName": student["LName"],
                    "PanelName": incoming_json["PanelName"],
                    "CreatedAt": get_current_time_utc(),
                    "EnteredQuestionsTotalScore": Decimal(-1),
                    "FinalTotalScore": Decimal(-1),
                    "QuestionStageScore": Decimal(-1),
                    "TagStageScore": Decimal(-1),
                    "VoteStageScore": Decimal(-1),
                }
                new_metrics.append(new_metric)
            except Exception as e:
                continue
        get_metric_db().add_metrics_batch(new_metrics)
        return {"PanelID": new_panel_id}
    except Exception as e:
        raise BadRequestError(str(e))


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
def get_panel_distribute(id):
    response = distribute_tag_questions(id)

    return response


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
    "/panel/{id}/questions/submitted",
    methods=["GET"],
    authorizer=authorizers,
)
def get_my_panel_questions(id):
    try:
        user_id = app.current_request.context["authorizer"]["principalId"]
        questions = get_question_db().get_my_questions_by_panel(
            panel_id=id, user_id=user_id
        )
    except Exception:
        raise ChaliceViewError("Error trying to get questions")

    return {"questions": questions}


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
        response = group_similar_questions(id)
        return response
    except Exception as e:
        raise BadRequestError("Error trying to group questions")


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

    panel = get_panel_db().get_panel(panel_id)
    if panel is None:
        raise NotFoundError("Panel (%s) not found" % panel_id)

    # Deadline checks
    present_time = datetime.now(timezone.utc)
    questions_deadline = datetime.fromisoformat(panel["QuestionStageDeadline"])
    tagging_deadline = datetime.fromisoformat(panel["TagStageDeadline"])

    # if present_time < questions_deadline + timedelta(minutes=30):
    #     return Response(
    #         body={
    #             "error": f'Action not allowed yet. This stage opens 30 mins after the deadline for the "Submit Questions" stage'
    #         },
    #         status_code=400,
    #     )

    # Fetch the metrics for the student from the database and check if they have already completed it
    student_metrics = get_metric_db().get_metric(user_id, panel_id)
    if "TagStageOutTime" in student_metrics:
        return Response(
            body={
                "error": "This task has been completed and can no longer be modified"
            },
            status_code=400,
        )

    # Check if the tagging stage deadline has passed
    if present_time > tagging_deadline:
        return Response(body={"error": "Action not allowed anymore"}, status_code=400)

    if not panel_id or not user_id:
        return Response(body={"error": "Missing panelId or userId"}, status_code=400)

    object_key = f"{panel_id}/questions.json"

    print(
        f"Getting questions for User ID: {user_id} from S3 Bucket Name: {PANELS_BUCKET_NAME} and object name: {object_key}"
    )
    questions_data, error = get_s3_objects(PANELS_BUCKET_NAME, object_key)

    if error:
        app.log.error(f"Error fetching from S3: {error}")
        return Response(
            body={"error": "Unable to fetch question data. Please check back later"},
            status_code=500,
        )

    if questions_data:
        user_question = questions_data.get(user_id)

    if user_question:
        student_metrics = get_metric_db().get_metric(user_id, panel_id)
        student_metrics["TagStageInTime"] = get_current_time_utc()
        get_metric_db().add_metric(student_metrics)

        return {"question": user_question}
    else:
        return Response(body={"error": "Question not found for user"}, status_code=404)


# It will run every day at 00:05 AM UTC
@app.schedule(Cron(5, 0, "*", "*", "?", "*"))
def daily_tasks(event):
    today = datetime.fromisoformat(get_current_time_utc())
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    today_date_string = today.strftime("%Y-%m-%d")
    yesterday_date_string = yesterday.strftime("%Y-%m-%d")
    tomorrow_date_string = tomorrow.strftime("%Y-%m-%d")

    html_message = f"<h3>Scheduled tasks for {today_date_string}</h3>"

    if ENV != "production":
        html_message += f"<h3 style='color: #FCE300'>Enviroment: {ENV}</h3>"

    # Tasks for Yesterday
    # Tasks after QuestionStageDeadline
    #   - Distributing questions (generates and stores s3 file)
    panels = get_panel_db().get_panels_by_deadline(
        stage_name="QuestionStageDeadline", deadline_date=yesterday_date_string
    )

    html_message += "<h4>Panels with Questions stage yesterday</h4>"
    html_message += "<ul>"
    if not panels:
        html_message += "<li>None</p>"
    else:
        for panel in panels:
            # Run distribute question script
            distribute_tag_questions(panel["PanelID"])
            html_message += f"<li>{panel['PanelName']} by {panel['Panelist']} (ID: {panel['PanelID']})</li>"  # Add if distribute question script ran succesfully
    html_message += "</ul>"

    # Tasks after TagStageDeadline
    #   - Grouping similar questions
    panels = get_panel_db().get_panels_by_deadline(
        stage_name="TagStageDeadline", deadline_date=yesterday_date_string
    )

    html_message += "<h4>Panels with Tag stage yesterday</h4>"
    html_message += "<ul>"
    if not panels:
        html_message += "<li>None</li>"
    else:

        for panel in panels:
            # Run distribute question script for each panel
            group_similar_questions(panel["PanelID"])
            html_message += f"<li>{panel['PanelName']} by {panel['Panelist']} (ID: {panel['PanelID']})</li>"  # Add if distribute question script ran succesfully
    html_message += "</ul>"

    # Tasks after VoteStageDeadline
    #   - Grading
    panels = get_panel_db().get_panels_by_deadline(
        stage_name="VoteStageDeadline", deadline_date=yesterday_date_string
    )

    html_message += "<h4>Panels with Vote today:</h4>"
    html_message += "<ul>"
    if not panels:
        html_message += "<li>None</li>"
    else:
        for panel in panels:
            generate_final_question_list(panel["PanelID"])
            grading_script(panel_id=panel["PanelID"])
            html_message += f"<li>{panel['PanelName']} by {panel['Panelist']} (ID: {panel['PanelID']})</li>"  # Add if distribute question script ran succesfully
    html_message += "</ul>"

    # Tasks for Today

    # Tasks on PanelStartDate
    #   - Notify which panels are starting
    panels = get_panel_db().get_panels_by_deadline(
        stage_name="PanelStartDate", deadline_date=today_date_string
    )

    html_message += "<h4>Panels starting today</h4>"
    html_message += "<ul>"
    if not panels:
        html_message += "<li>None</li>"
    else:
        for panel in panels:
            html_message += f"<li>{panel['PanelName']} by {panel['Panelist']} (ID: {panel['PanelID']})</li>"
    html_message += "</ul>"

    # Tasks for Tomorrow

    # Tasks before PanelPresentationDate
    #   - Sent email to Panelist
    panels = get_panel_db().get_panels_by_deadline(
        stage_name="PanelPresentationDate", deadline_date=tomorrow_date_string
    )

    html_message += "<h4>Panels presenting tomorrow</h4>"
    html_message += "<ul>"
    if not panels:
        html_message += "<li>None</li>"
    else:
        for panel in panels:
            html_message += f"<li>{panel['PanelName']} by {panel['Panelist']} (ID: {panel['PanelID']})</li>"
            # Send email to each panelist!!!! with questions???
            # panelist_emails = panel['PanelistEmail']

    html_message += "</ul>"

    # Query all admins and send email
    admins = get_user_db().get_users_by_role(ADMIN_ROLE)

    admin_addresses = []
    for admin in admins:
        admin_addresses.append(admin["EmailID"])

    send_email(
        destination_addresses=[SES_EMAIL_ADDRESS],
        bcc_addresses=admin_addresses,
        subject=f"Daily tasks for {today_date_string}",
        html_body=html_message,
    )

    return html_message


@app.route(
    "/panel/{id}/questions/voting",
    methods=["GET"],
    authorizer=authorizers,
)
def get_questions_for_voting_stage(id):
    panel_id = id
    # user_question = None
    # Fetch user id
    user_id = app.current_request.context["authorizer"]["principalId"]

    panel = get_panel_db().get_panel(panel_id)
    if panel is None:
        raise NotFoundError("Panel (%s) not found" % panel_id)

    # Deadline checks
    present_time = datetime.now(timezone.utc)
    tagging_deadline = datetime.fromisoformat(panel["TagStageDeadline"])
    voting_deadline = datetime.fromisoformat(panel["VoteStageDeadline"])

    # check if the deadline for the tagging stage has sufficiently passed
    # if present_time < tagging_deadline + timedelta(minutes=30):
    #     return Response(
    #         body={
    #             "error": f'Action not allowed yet. This stage opens 30 mins after the deadline for the "Tag Questions" stage'
    #         },
    #         status_code=400,
    #     )

    # Fetch the metrics for the student from the database and check if they have already completed it
    student_metrics = get_metric_db().get_metric(user_id, panel_id)
    if "VoteStageOutTime" in student_metrics:
        return Response(
            body={
                "error": "This task has been completed and can no longer be modified"
            },
            status_code=400,
        )

    # Fetch the metrics for the student from the database and check if they have already completed it
    student_metrics = get_metric_db().get_metric(user_id, panel_id)
    if "VoteStageOutTime" in student_metrics:
        return Response(
            body={
                "error": "This task has been completed and can no longer be modified"
            },
            status_code=400,
        )

    # Check if the voting stage deadline has passed
    if present_time > voting_deadline:
        return Response(body={"error": "Action not allowed anymore"}, status_code=400)

    if not panel_id or not user_id:
        return Response(body={"error": "Missing panelId or userId"}, status_code=400)

    object_key = f"{panel_id}/sortedCluster.json"

    # Check cache first!

    # if not cached
    #  - get s3 object
    #  - set cache with TTL
    #  - return object

    print(
        f"Getting questions for voting stage for panel ID: {id} from S3 Bucket Name: {PANELS_BUCKET_NAME} and object name: {object_key}"
    )

    questions_data, error = get_s3_objects(PANELS_BUCKET_NAME, object_key)

    if error:
        app.log.error(f"Error fetching from S3: {error}")
        return Response(
            body={"error": "Unable to fetch question data. Please check back later"},
            status_code=500,
        )

    if not questions_data:
        return Response(
            body={"error": "Questions not found for panel"}, status_code=404
        )

    # Initialize question_map
    question_map = {}

    # Iterate through the top 20 questions in questions_data to fill question_map
    for item in questions_data[:20]:
        rep_id = item["rep_id"]
        rep_question = item["rep_question"]

        # Update question_map with rep_id as key and question details as value
        question_map[rep_id] = {
            "QuestionText": rep_question,
        }

    if question_map:
        print(f"Question map: {question_map}")
        student_metrics = get_metric_db().get_metric(user_id, panel_id)
        student_metrics["VoteStageInTime"] = get_current_time_utc()
        get_metric_db().add_metric(student_metrics)

        return {"question": question_map}
    else:
        # If question_map is empty after processing, it means no questions were found.
        return Response(
            body={"error": "Questions not found for panel"}, status_code=404
        )


@app.route(
    "/panel/{id}/questions/voting",
    methods=["POST"],
    authorizer=authorizers,
)
def post_submit_votes(id):
    try:
        # {vote_order: [<id_1>, <id_2>, <id_3>...<id_20>]}
        user_id = app.current_request.context["authorizer"]["principalId"]
        panel_id = id
        request = app.current_request.json_body
        if "vote_order" not in request:
            raise BadRequestError("vote_order not present in request body")
        score = 20
        batch_res = []
        for q_id in request["vote_order"]:
            q_obj = get_question_db().get_question(q_id)
            if "VoteScore" in q_obj:
                q_obj["VoteScore"] += score
            else:
                q_obj["VoteScore"] = score
            batch_res.append(q_obj)
            score -= 1

        get_question_db().add_questions_batch(batch_res)

        # Record VoteStageOutTime
        student_metrics = get_metric_db().get_metric(user_id, panel_id)
        student_metrics["VoteStageOutTime"] = get_current_time_utc()
        get_metric_db().add_metric(student_metrics)

        panel_name = get_panel_db().get_panel(id).get("PanelName")
        pretty_time = datetime.now(timezone.utc).strftime("%m/%d/%Y at %H:%M:%S UTC")

        html_body = "<h4>Questions Voting Completed Successfully</h4>"
        html_body += "<p>Thank you for voting the questions assigned to you. We appreciate your engagement.</p>"
        html_body += "<p>Submission details:</p>"
        html_body += "<ul>"
        html_body += f"<li>{panel_name}</li>"
        html_body += f"<li>Submission: {pretty_time}</li>"
        html_body += "</ul>"
        html_body += "<p>Best regards,<br/>"
        html_body += "PANEL-G team</p>"

        student_email = get_user_db().get_user(user_id).get("EmailID")

        # Returns the result of put_item, kind of metadata and stuff
        send_email(
            destination_addresses=[student_email],
            subject="Questions tagged",
            html_body=html_body,
        )

        return f"Voting recorded successfully"
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/panel/{id}/questions/final",
    methods=["GET"],
    authorizer=authorizers,
)
def get_final_question_list(id):
    try:
        return generate_final_question_list(id)
    except Exception as e:
        raise BadRequestError(str(e))


@app.route(
    "/panel/{id}/metric/final",
    methods=["GET"],
    authorizer=authorizers,
)
def post_grades(id):
    try:
        return grading_script(id)
    except Exception as e:
        raise BadRequestError(str(e))


@app.route(
    "/panel/{id}/questions/send",
    methods=["GET"],
    authorizer=authorizers,
)
def send_questions_to_panelists(id):
    try:
        panel = get_panel_db().get_panel(id)
        panelists_emails = panel.get("PanelistEmail")
        panel_name = panel.get("PanelName")
        users = get_user_db()
        admins = users.get_users_by_role(ADMIN_ROLE)
        # We don't have a moderator role!
        moderators = users.get_users_by_role("moderator")

        admin_moderator_emails = []
        for admin in admins:
            admin_moderator_emails.append(admin.get("EmailID"))
        for moderator in moderators:
            admin_moderator_emails.append(moderator.get("EmailID"))

        # get presentation date and time
        presentation_datetime = datetime.fromisoformat(
            panel.get("PanelPresentationDate").replace("Z", "+00:00")
        )
        presentation_date = presentation_datetime.date()
        presentation_time = str(presentation_datetime.time())
        time_format = "%H:%M:%S.%f" if "." in presentation_time else "%H:%M:%S"
        time_object = datetime.strptime(presentation_time, time_format)
        presentation_time_formatted = time_object.strftime("%I:%M %p")

        # get top voted questions
        object_key = f"{id}/finalQuestions.json"
        print(
            f"Getting final questions for panel ID: {id} from S3 Bucket Name: {PANELS_BUCKET_NAME} and object name: {object_key}"
        )
        top_questions, error = get_s3_objects(PANELS_BUCKET_NAME, object_key)

        # print(top_questions)

        if error:
            app.log.error(f"Error fetching from S3: {error}")
            return Response(
                body={"error": "Unable to fetch question data"}, status_code=500
            )
        if not top_questions:
            return Response(
                body={"error": "Questions not found for panel"}, status_code=404
            )

        top_questions_text = []
        for i in range(len(top_questions)):
            top_questions_text.append(top_questions[i]["rep_question"])

        html_body = f"""
            Dear Panelist,
            <br>
            <p>We're excited to invite you to join us as a panelist for an upcoming session where you'll have the opportunity to answer questions from our students. </p>
            <p>The session is scheduled for <strong>{presentation_date}</strong> at <strong>{presentation_time_formatted} CT</strong>.</p>
            <p>Here is the list of questions curated from our students:</p>
            <ul>
                {"".join([f"<li>{question_text}</li>" for question_text in top_questions_text])}
            </ul>
            <p>Please review these at your earliest convenience to prepare for the session.</p>
            <p>Looking forward to your participation!</p>
            <p>Best regards,</p>
            The Panel Management System Team
            """

        # send an email to the panelist
        send_email(
            destination_addresses=[SES_EMAIL_ADDRESS],
            cc_addresses=admin_moderator_emails,
            subject=f"Panel-G: Questions for panelist on {panel_name}",
            html_body=html_body,
        )

        return top_questions_text

    except Exception as e:
        return {"error": str(e)}
