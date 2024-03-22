from chalicelib.config import (
    USER_TABLE_NAME,
    QUESTION_TABLE_NAME,
    PANEL_TABLE_NAME,
    METRIC_TABLE_NAME
)
from chalicelib.constants import (
    BOTO3_DYNAMODB_TYPE,
)
import boto3
from chalicelib import db


_USER_DB = None
_QUESTION_DB = None
_PANEL_DB = None
_METRIC_DB = None

def get_panel_db():
    global _PANEL_DB
    try:
        if _PANEL_DB is None:
            _PANEL_DB = db.DynamoPanelDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(PANEL_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _PANEL_DB


def get_user_db():
    global _USER_DB
    try:
        if _USER_DB is None:
            _USER_DB = db.DynamoUserDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(USER_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _USER_DB


def get_question_db():
    global _QUESTION_DB
    try:
        if _QUESTION_DB is None:
            _QUESTION_DB = db.DynamoQuestionDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(QUESTION_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _QUESTION_DB


def get_metric_db():
    global _METRIC_DB
    try:
        if _METRIC_DB is None:
            _METRIC_DB = db.DynamoMetricDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(METRIC_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _METRIC_DB
