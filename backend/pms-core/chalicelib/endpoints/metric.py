from chalice import Blueprint

from chalicelib.database.db_provider import get_metric_db
from chalicelib.auth.token_authorizer import token_authorizer


metric_routes = Blueprint(__name__)


@metric_routes.route(
    "/",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_all_metrics_():
    try:
        metrics = get_metric_db().list_metrics()
    except Exception as e:
        return {"error": str(e)}

    return metrics
