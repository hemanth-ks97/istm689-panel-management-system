from chalicelib.config import (
    USER_TABLE_NAME,
    QUESTION_TABLE_NAME,
    PANEL_TABLE_NAME,
    METRIC_TABLE_NAME,
    LOG_TABLE_NAME,
)
from chalicelib.constants import (
    BOTO3_DYNAMODB_TYPE,
)

from boto3.dynamodb.conditions import Key, Attr
from boto3 import resource

_USER_DB = None
_QUESTION_DB = None
_PANEL_DB = None
_METRIC_DB = None
_LOG_DB = None


def get_panel_db():
    global _PANEL_DB
    try:
        if _PANEL_DB is None:
            _PANEL_DB = DynamoPanelDB(
                resource(BOTO3_DYNAMODB_TYPE).Table(PANEL_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _PANEL_DB


def get_user_db():
    global _USER_DB
    try:
        if _USER_DB is None:
            _USER_DB = DynamoUserDB(
                resource(BOTO3_DYNAMODB_TYPE).Table(USER_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _USER_DB


def get_question_db():
    global _QUESTION_DB
    try:
        if _QUESTION_DB is None:
            _QUESTION_DB = DynamoQuestionDB(
                resource(BOTO3_DYNAMODB_TYPE).Table(QUESTION_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _QUESTION_DB


def get_metric_db():
    global _METRIC_DB
    try:
        if _METRIC_DB is None:
            _METRIC_DB = DynamoMetricDB(
                resource(BOTO3_DYNAMODB_TYPE).Table(METRIC_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _METRIC_DB


def get_log_db():
    global _LOG_DB
    try:
        if _LOG_DB is None:
            _LOG_DB = DynamoLogDB(resource(BOTO3_DYNAMODB_TYPE).Table(LOG_TABLE_NAME))
    except Exception as e:
        return {"error": str(e)}
    return _LOG_DB


"""Question Database Service"""


class QuestionDB(object):
    def list_questions(self):
        pass

    def add_question(self, question):
        pass

    def get_question(self, question_id):
        pass

    def add_questions_batch(self, questions):
        pass

    def delete_question(self, question_id):
        pass

    def get_question_ids_by_panel_id(self, panel_id):
        pass

    def get_questions_by_panel(self, panel_id):
        pass

    def get_my_questions_by_panel(self, panel_id, user_id):
        pass


class DynamoQuestionDB(QuestionDB):
    def __init__(self, table_resource):
        self._table = table_resource

    def list_questions(
        self,
        startswith=None,
    ):
        scan_params = {}
        filter_expression = None
        if startswith is not None:
            filter_expression = self._add_to_filter_expression(
                filter_expression, Attr("Name").begins_with(startswith)
            )

        if filter_expression:
            scan_params["FilterExpression"] = filter_expression
        response = self._table.scan(**scan_params)
        return response["Items"]

    def add_question(self, question):
        self._table.put_item(Item=question)

    def add_questions_batch(self, questions):
        with self._table.batch_writer() as batch:
            for question in questions:
                batch.put_item(Item=question)

    def get_question(self, question_id):
        response = self._table.get_item(
            Key={
                "QuestionID": question_id,
            },
        )
        return response.get("Item")

    def get_question_ids_by_panel_id(self, panel_id):
        response = self._table.query(
            IndexName="PanelIDIndex",
            KeyConditionExpression="PanelID = :panel_id",
            ExpressionAttributeValues={":panel_id": panel_id},
        )
        return [item["QuestionID"] for item in response["Items"]]

    def get_questions_by_panel(self, panel_id):
        response = self._table.scan(FilterExpression=Attr("PanelID").eq(panel_id))
        return response["Items"]

    def get_my_questions_by_panel(self, panel_id, user_id):
        response = self._table.scan(
            FilterExpression=Attr("PanelID").eq(panel_id) & Attr("UserID").eq(user_id)
        )
        return response["Items"]

    def delete_question(self, question_id):
        self._table.delete_item(
            Key={
                "QuestionID": question_id,
            }
        )

    def _add_to_filter_expression(self, expression, condition):
        if expression is None:
            return condition
        return expression & condition


""" Panel DB service """


class PanelDB(object):

    def add_panel(self, panel):
        pass

    def get_panel(self, panel_id):
        pass

    def update_panel(self, panel):
        pass

    def get_panels_by_deadline(self, stage_name, deadline_date):
        pass

    def get_all_panels(self):
        pass

    def get_number_of_questions_by_panel_id(self, panel_id):
        pass


class DynamoPanelDB(PanelDB):
    def __init__(self, table_resource):
        self._table = table_resource

    def add_panel(self, panel):
        return self._table.put_item(Item=panel)

    def update_panel(self, panel):
        return self._table.put_item(Item=panel)

    def get_all_panels(self):
        response = self._table.scan()
        return response["Items"]

    def get_public_panels(self):
        response = self._table.scan(FilterExpression=Attr("Visibility").eq("public"))
        return response["Items"]

    def get_panel(self, panel_id):
        response = self._table.get_item(
            Key={
                "PanelID": panel_id,
            },
        )
        return response.get("Item")

    def get_panels_by_deadline(self, stage_name, deadline_date):
        response = self._table.scan(
            FilterExpression=Attr(stage_name).begins_with(deadline_date)
        )
        return response["Items"]

    def get_number_of_questions_by_panel_id(self, panel_id):
        response = self._table.query(
            KeyConditionExpression="PanelID = :panel_id",
            ExpressionAttributeValues={":panel_id": panel_id},
        )
        return [int(item["NumberOfQuestions"]) for item in response["Items"]]


"""User Database Service"""


class UserDB(object):
    def list_users(self):
        pass

    def add_user(self, user):
        pass

    def get_user(self, user_id):
        pass

    def get_user_role(self, user_id):
        pass

    def update_user(self, user):
        pass

    def add_user_google_id(self, user_id, google_id):
        pass

    def get_user_by_google_id(self, google_id):
        pass

    def get_user_by_email(self, email):
        pass

    def get_users_by_role(self, role):
        pass

    def delete_user(self, user_id):
        pass


class DynamoUserDB(UserDB):
    def __init__(self, table_resource):
        self._table = table_resource

    def list_users(
        self,
        startswith=None,
    ):
        scan_params = {}
        filter_expression = None
        if startswith is not None:
            filter_expression = self._add_to_filter_expression(
                filter_expression, Attr("Name").begins_with(startswith)
            )

        if filter_expression:
            scan_params["FilterExpression"] = filter_expression
        response = self._table.scan(**scan_params)
        return response["Items"]

    def get_student_user_ids(self):
        response = self._table.query(
            IndexName="RoleIndex",
            KeyConditionExpression="#roleAttr = :roleVal",
            ExpressionAttributeNames={
                "#roleAttr": "Role",  # Placeholder for the reserved word 'role'
            },
            ExpressionAttributeValues={
                ":roleVal": "student",
            },
        )
        return {item["UserID"] for item in response["Items"]}

    def add_user(self, user):
        return self._table.put_item(Item=user)

    def update_user(self, user):
        return self._table.put_item(Item=user)

    def add_user_google_id(self, user_id, google_id):
        return self._table.update_item(
            Key={"UserID": user_id},
            AttributeUpdates={
                "GoogleID": google_id,
            },
        )

    def get_user(self, user_id):
        response = self._table.get_item(
            Key={
                "UserID": user_id,
            },
        )
        return response.get("Item")

    def get_user_role(self, user_id):
        user = self.get_user(user_id)
        return user["Role"]

    def get_user_by_google_id(self, google_id):
        response = self._table.scan(FilterExpression=Attr("GoogleID").eq(google_id))
        return response["Items"]

    def get_user_by_email(self, email):
        response = self._table.scan(FilterExpression=Attr("EmailID").eq(email))
        return response["Items"]

    def get_users_by_role(self, role):
        response = self._table.scan(FilterExpression=Attr("Role").eq(role))
        return response["Items"]

    def get_user_by_uin(self, uin):
        response = self._table.scan(FilterExpression=Attr("UIN").eq(uin))
        return response["Items"]

    def delete_user(self, user_id):
        self._table.delete_item(
            Key={
                "UserID": user_id,
            }
        )

    def _add_to_filter_expression(self, expression, condition):
        if expression is None:
            return condition
        return expression & condition


"""Metric Database Service"""


class MetricDB(object):
    def add_metric(self, metric):
        pass

    def get_metric(self, user_id, panel_id):
        pass

    def update_metric(self, metric):
        pass

    def list_metrics(self):
        pass

    def delete_metric(self, user_id, panel_id):
        pass

    def get_metrics_by_user(self, user_id):
        pass

    def get_metrics_by_panel(self, panel_id):
        pass


class DynamoMetricDB(MetricDB):
    def __init__(self, table_resource):
        self._table = table_resource

    def add_metric(self, metric):
        return self._table.put_item(Item=metric)

    def get_metric(self, user_id, panel_id):
        response = self._table.get_item(
            Key={
                "UserID": user_id,
                "PanelID": panel_id,
            },
        )
        return response.get("Item")

    def update_metric(self, metric):
        return self._table.put_item(Item=metric)

    def list_metrics(self):
        response = self._table.scan()
        return response["Items"]

    def delete_metric(self, user_id, panel_id):
        self._table.delete_item(
            Key={
                "UserID": user_id,
                "PanelID": panel_id,
            }
        )

    def get_metrics_by_user(self, user_id):
        response = self._table.scan(FilterExpression=Attr("UserID").eq(user_id))
        return response["Items"]

    def get_metrics_by_panel(self, panel_id):
        response = self._table.scan(FilterExpression=Attr("PanelID").eq(panel_id))
        return response["Items"]


class LogDB(object):
    def list_logs(self):
        pass

    def add_log(self, log):
        pass

    def get_log(self, log_id):
        pass

    def get_logs_by_date(self, date):
        pass


class DynamoLogDB(LogDB):
    def __init__(self, table_resource):
        self._table = table_resource

    def list_logs(self):
        response = self._table.scan()
        return response["Items"]

    def add_log(self, log):
        return self._table.put_item(Item=log)

    def get_log(self, log_id):
        response = self._table.get_item(
            Key={
                "LogID": log_id,
            },
        )
        return response.get("Item")

    def get_logs_by_date(self, date):
        pass
