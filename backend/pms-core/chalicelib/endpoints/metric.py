from chalicelib.database.db_provider import get_metric_db
from chalicelib.auth.token_authorizer import token_authorizer

from chalice import Blueprint


metric_routes = Blueprint(__name__)


@metric_routes.route(
    "/metric",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_all_metrics_():
    try:
        metrics = get_metric_db().list_metrics()
    except Exception as e:
        return {"error": str(e)}

    return metrics


@metric_routes.route(
    "/panel/{id}/metrics",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_metrics_by_panel(id):
    # Need to check
    # Only for admins
    try:
        metrics = get_metric_db().get_metrics_by_panel(id)
    except Exception as e:
        return {"error": str(e)}

    return metrics


@metric_routes.route(
    "/user/{id}/metrics",
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
