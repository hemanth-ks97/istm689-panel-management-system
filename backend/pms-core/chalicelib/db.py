from boto3.dynamodb.conditions import Key, Attr


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


""" Panel DB service """


class PanelDB(object):

    def add_panel(self, panel):
        pass

    def get_panel(self, panel_id):
        pass

    def get_all_panels(self):
        pass


class DynamoPanelDB(PanelDB):
    def __init__(self, table_resource):
        self._table = table_resource

    def add_panel(self, panel):
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
