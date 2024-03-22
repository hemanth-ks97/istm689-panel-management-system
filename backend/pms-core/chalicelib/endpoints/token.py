from chalicelib.database.db_provider import get_user_db
from chalice import Blueprint
from chalice import (
    NotFoundError,
)
from chalicelib.utils import (
    verify_token,
    create_token,
)
from datetime import datetime

token_routes = Blueprint(__name__)


@token_routes.route(
    "/token/create",
    methods=["POST"],
)
def create_new_token():
    """Need to receive a token, decoded and return a new custom token with internal user ID"""

    try:
        json_body = token_routes.current_request.json_body
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
        user["LastLogin"] = datetime.now().isoformat(timespec="seconds")
        get_user_db().update_user(user)
    except Exception:
        # Not always true but this is a Chalice Exception
        raise NotFoundError("User not found")

    return {"token": new_token}
