"""Main application file for the PMS Core API."""

<<<<<<< HEAD
import itertools
from collections import Counter
from collections import defaultdict

import requests
=======
>>>>>>> origin/dev
import boto3
from chalice import (
    Chalice,
    CORSConfig,
)

from chalicelib.config import ENV, ALLOW_ORIGIN

"""
    Register app with chalice before importing modules from chalicelib
    The order matters to avoid ciruclar import problems
"""
app = Chalice(app_name=f"{ENV}-pms-core")
app.api.cors = CORSConfig(
    allow_origin=ALLOW_ORIGIN,
)

"""
    Import any external module from chalice lib here
    This should only be done after registering chalice app
"""
from chalicelib.endpoints.panel import panel_routes
from chalicelib.endpoints.question import question_routes
from chalicelib.endpoints.user import user_routes
from chalicelib.endpoints.csv_file import csv_file_routes
from chalicelib.endpoints.token import token_routes
from chalicelib.endpoints.panel_login import panel_login_routes
from chalicelib.endpoints.metric import metric_routes

"""
    Register the endpoints here after importing 
"""
app.register_blueprint(panel_routes)
app.register_blueprint(question_routes)
app.register_blueprint(user_routes)
app.register_blueprint(csv_file_routes)
app.register_blueprint(token_routes)
app.register_blueprint(panel_login_routes)
app.register_blueprint(metric_routes)


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