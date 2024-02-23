from boto3.dynamodb.conditions import Attr

"""Question Database Service"""


class QuestionDB(object):
    def list_questions(self):
        pass

    def add_question(self, question):
        pass

    def get_question(self, question_id):
        pass

    def delete_question(self, question_id):
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

    def get_question(self, question_id):
        response = self._table.get_item(
            Key={
                "QuestionID": question_id,
            },
        )
        return response.get("Item")

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


"""User Database Service"""


class UserDB(object):
    def list_users(self):
        pass

    def add_user(self, user):
        pass

    def get_user(self, user_id):
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

    def add_user(self, user):
        self._table.put_item(Item=user)

    def get_user(self, user_id):
        response = self._table.get_item(
            Key={
                "UserID": user_id,
            },
        )
        return response.get("Item")

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
