"""Main application file for the PMS Core API."""

import boto3
from chalice import (
    Chalice,
    CORSConfig,
)

from chalicelib.config import ENV, ALLOW_ORIGIN

from chalicelib.auth.token_authorizer import auth_routes
from chalicelib.endpoints.panel import panel_routes
from chalicelib.endpoints.question import question_routes
from chalicelib.endpoints.user import user_routes
from chalicelib.endpoints.file import file_routes
from chalicelib.endpoints.login import login_routes
from chalicelib.endpoints.metric import metric_routes

"""
    Register app with chalice before importing modules from chalicelib
    The order matters to avoid ciruclar import problems
"""
app = Chalice(app_name=f"{ENV}-pms-core")
app.api.cors = CORSConfig(
    allow_origin=ALLOW_ORIGIN,
)


"""
    Register the endpoints here after importing 
"""
app.register_blueprint(auth_routes)
app.register_blueprint(
    panel_routes,
    url_prefix="/panel",
)
app.register_blueprint(question_routes, url_prefix="/question")
app.register_blueprint(user_routes, url_prefix="/user")
app.register_blueprint(file_routes, url_prefix="/file")
app.register_blueprint(login_routes, url_prefix="/login")
app.register_blueprint(metric_routes, url_prefix="/metric")


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


@app.route("/")
def index():
    """Index route. Dummy endpoint"""

    # Workaround to force chalice to generate all policies
    # It never executes
    if False:
        dummy()
    return {"API": app.app_name}
