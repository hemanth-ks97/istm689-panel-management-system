"""Main application file for the PMS Core API."""

import requests
import boto3
import pandas as pd
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
        destination_addresses=["davidgomilliontest@gmail.com"],
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

        panel = get_panel_db().get_panel(panel_id)
        if panel is None:
            raise NotFoundError("Panel (%s) not found" % panel_id)

        # Validate if panel still acepts questions!!
        present = datetime.now(timezone.utc)
        questions_deadline = datetime.fromisoformat(panel["QuestionStageDeadline"])

        if present > questions_deadline:
            raise BadRequestError("Action not allow anymore")

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
        html_body += "PMS team</p>"

        # Returns the result of put_item, kind of metadata and stuff
        send_email(
            destination_addresses=["davidgomilliontest@gmail.com"],
            subject="Questions submitted",
            html_body=html_body,
        )

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
            send_email(
                destination_addresses=["davidgomilliontest@gmail.com"],
                subject="Questions flagged!",
                html_body=html_body,
            )

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


# It will run every day at 07:00 AM UTC
# 07:00 AM UTC -> 02:00 AM CST or 01:00 AM depeding on daylight saving time
@app.schedule(Cron(5, 0, "*", "*", "?", "*"))
def daily_tasks(event):

    today = datetime.fromisoformat(get_current_time_utc())
    today_date_string = today.strftime("%Y-%m-%d")

    html_message = f"<h3>Scheduled tasks for {today_date_string}</h3>"

    if ENV != "production":
        html_message += f"<h3 style='color: #FCE300'>Enviroment: {ENV}</h3>"

    # Tasks after PanelStartDate
    #   - Nothing
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

    # Tasks after QuestionStageDeadline
    #   - Distributing questions (generates and stores s3 file)
    panels = get_panel_db().get_panels_by_deadline(
        stage_name="QuestionStageDeadline", deadline_date=today_date_string
    )

    html_message += "<h4>Panels with Questions stage today</h4>"
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
        stage_name="TagStageDeadline", deadline_date=today_date_string
    )

    html_message += "<h4>Panels with Tag stage today</h4>"
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
        stage_name="VoteStageDeadline", deadline_date=today_date_string
    )

    html_message += "<h4>Panels with Vote today:</h4>"
    html_message += "<ul>"
    if not panels:
        html_message += "<li>None</li>"
    else:
        for panel in panels:
            # Run grading script
            # Something like this
            # graded = grade_panel(panel['PanelID'])
            html_message += f"<li>{panel['PanelName']} by {panel['Panelist']} (ID: {panel['PanelID']})</li>"  # Add if distribute question script ran succesfully
    html_message += "</ul>"

    # Tasks after PanelPresentationDate
    #   - Nothing

    # Query all admins and send email
    admins = get_user_db().get_users_by_role(ADMIN_ROLE)

    admin_addresses = []
    for admin in admins:
        admin_addresses.append(admin["EmailID"])

    send_email(
        destination_addresses=["davidgomilliontest@gmail.com"],
        # bcc_addresses=admin_addresses,
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

    if not panel_id or not user_id:
        return Response(body={"error": "Missing panelId or userId"}, status_code=400)

    object_key = f"{panel_id}/sortedCluster.json"

    # Check cache first!

    # if not cached
    #  - get s3 object
    #  - set cache with TTL
    #  - return object

    print(
        f"Getting questions for voting stgae for panel ID: {id} from S3 Bucket Name: {PANELS_BUCKET_NAME} and object name: {object_key}"
    )

    questions_data, error = get_s3_objects(PANELS_BUCKET_NAME, object_key)

    if error:
        app.log.error(f"Error fetching from S3: {error}")
        return Response(
            body={"error": "Unable to fetch question data"}, status_code=500
        )

    if not questions_data:
        return Response(
            body={"error": "Questions not found for panel"}, status_code=404
        )

    # Initialize question_map
    question_map = {}

    # Iterate through questions_data to fill question_map
    for item in questions_data:
        rep_id = item["rep_id"]
        rep_question = item["rep_question"]

        # Update question_map with rep_id as key and question details as value
        question_map[rep_id] = {
            "QuestionText": rep_question,
        }

    if question_map:
        print(f"Question map: {question_map}")
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
            q_obj["VoteScore"] += score if "VoteScore" in q_obj else score
            batch_res.append(q_obj)
            score -= 1

        get_question_db().add_questions_batch(batch_res)
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
        panel_id = id
        object_key = f"{panel_id}/sortedCluster.json"

        questions_data, error = get_s3_objects(PANELS_BUCKET_NAME, object_key)

        if error:
            app.log.error(f"Error fetching from S3: {error}")
            return Response(
                body={"error": "Unable to fetch question data"}, status_code=500
            )

        if not questions_data:
            return Response(
                body={"error": "Questions not found for panel"}, status_code=404
            )

        # Build question cache of top 20 questions
        question_cache = []
        for cluster_obj in questions_data:
            question_obj = get_question_db().get_question(cluster_obj["rep_id"])
            question_cache.append(question_obj)

        top_questions = sorted(
            question_cache, key=lambda x: x["VoteScore"], reverse=True
        )

        res = []
        for obj in top_questions[:10]:
            res.append(
                {
                    "rep_id": obj["QuestionID"],
                    "rep_question": obj["QuestionText"],
                    "votes": obj["VoteScore"],
                }
            )

        return res

    except Exception as e:
        return {"error": str(e)}
