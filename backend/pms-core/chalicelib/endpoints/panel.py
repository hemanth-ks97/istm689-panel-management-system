from chalicelib.database.db_provider import get_panel_db, get_user_db
from chalicelib.auth.token_authorizer import token_authorizer
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    ADMIN_ROLE,
)
from chalice import Blueprint
import uuid
from chalice import (
    BadRequestError,
    Response,
)
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    ADMIN_ROLE,
)
from datetime import datetime

panel_routes = Blueprint(__name__)


@panel_routes.route("/panel", authorizer=token_authorizer, methods=["GET"])
def get_all_panels():
    user_id = panel_routes.current_request.context["authorizer"]["principalId"]
    try:
        user_role = get_user_db().get_user_role(user_id)

        if user_role == ADMIN_ROLE:
            panels = get_panel_db().get_all_panels()
        else:
            panels = get_panel_db().get_public_panels()

        # Check user role

    except Exception as e:
        return {"error": str(e)}

    return panels


@panel_routes.route(
    "/panel",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_panel_info():
    user_id = panel_routes.current_request.context["authorizer"]["principalId"]
    try:
        user_role = get_user_db().get_user_role(user_id)

        if user_role != ADMIN_ROLE:
            raise BadRequestError("Only admin can perform this action")

        incoming_json = panel_routes.current_request.json_body

        new_panel = {
            "PanelID": str(uuid.uuid4()),
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
            "CreatedAt": datetime.now().isoformat(timespec="seconds"),
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


@panel_routes.route(
    "/panel/{id}",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_panel(id):
    # Fetch user id
    user_id = panel_routes.current_request.context["authorizer"]["principalId"]
    try:
        user_role = get_user_db().get_user_role(user_id)
        panel = get_panel_db().get_panel(id)

        if user_role != ADMIN_ROLE and panel["Visibility"] == "internal":
            raise BadRequestError("Only admin can view this panel")

        return panel

    except Exception as e:
        return {"error": str(e)}
