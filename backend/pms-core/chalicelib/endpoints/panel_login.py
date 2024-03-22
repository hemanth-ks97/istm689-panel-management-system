from chalicelib.database.db_provider import get_user_db
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    GOOGLE_RECAPTCHA_VERIFY_URL,
    PANELIST_ROLE,
)
from chalice import Blueprint
import requests
from urllib.parse import quote
from chalice import (
    NotFoundError,
    BadRequestError,
)
from chalicelib.email import send_email
from chalicelib.config import (
    GOOGLE_RECAPTCHA_SECRET_KEY,
)
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    GOOGLE_RECAPTCHA_VERIFY_URL,
    PANELIST_ROLE,
)
from chalicelib import db
from chalicelib.utils import (
    create_token,
)
from datetime import datetime

panel_login_routes = Blueprint(__name__)


@panel_login_routes.route(
    "/login/panel", methods=["POST"], content_types=[REQUEST_CONTENT_TYPE_JSON]
)
def get_login_panel():
    incoming_json = panel_login_routes.current_request.json_body

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

    # We are having a problem because real users get a score of 0.1, likely to be a robot
    # if response["score"] <= 0.5:
    #     raise BadRequestError("Score too low")

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
    user["LastLogin"] = datetime.now().isoformat(timespec="seconds")
    get_user_db().update_user(user)

    return response
