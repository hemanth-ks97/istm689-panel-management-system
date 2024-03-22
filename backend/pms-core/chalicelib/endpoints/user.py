from chalicelib.database.db_provider import get_user_db, get_metric_db
from chalicelib.auth.token_authorizer import token_authorizer
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    ADMIN_ROLE,
)
from chalice import Blueprint
import uuid
from chalice import (
    NotFoundError,
    BadRequestError,
)
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    ADMIN_ROLE,
)
from datetime import datetime

user_routes = Blueprint(__name__)


@user_routes.route(
    "/",
    methods=["GET"],
    # authorizer=token_authorizer,
)
def get_all_users():
    """
    User route, testing purposes.
    """
    user_id = user_routes.current_request.context["authorizer"]["principalId"]

    try:
        user_role = get_user_db().get_user_role(user_id)

        if user_role != ADMIN_ROLE:
            raise BadRequestError("Only admin can perform this action")

        users = get_user_db().list_users()
    except Exception as e:
        return {"error": str(e)}
    return users


@user_routes.route(
    "/",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_new_user():
    """User route, testing purposes."""
    user_id = user_routes.current_request.context["authorizer"]["principalId"]

    try:
        user_role = get_user_db().get_user_role(user_id)

        if user_role != ADMIN_ROLE:
            raise BadRequestError("Only admin can perform this action")

        incoming_json = user_routes.current_request.json_body

        # Check for all required fields
        if "name" not in incoming_json:
            raise BadRequestError("Key 'name' not found in incoming request")
        if "lastname" not in incoming_json:
            raise BadRequestError("Key 'lastname' not found in incoming request")
        if "email" not in incoming_json:
            raise BadRequestError("Key 'email' not found in incoming request")

        # Build User object for database
        new_user = {
            "UserID": str(uuid.uuid4()),
            "CreatedAt": datetime.now().isoformat(timespec="seconds"),
            "Name": incoming_json["name"],
            "LastName": incoming_json["lastname"],
            "Email": incoming_json["email"],
        }

        get_user_db().add_user(new_user)
        # Returns the result of put_item, kind of metadata and stuff

    except Exception as e:
        return {"error": str(e)}


@user_routes.route(
    "/{id}",
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


@user_routes.route(
    "/{id}/metrics",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_metrics_by_user(id):

    # Need to check
    # If you are a user, you can only request your grades!
    # if you are an admin, you get a free pass
    try:
        metrics = get_metric_db().get_metrics_by_user(id)
    except Exception as e:
        return {"error": str(e)}

    return metrics
