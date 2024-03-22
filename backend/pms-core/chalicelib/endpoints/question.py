from chalicelib.database.db_provider import get_panel_db, get_user_db, get_question_db
from chalicelib.auth.token_authorizer import token_authorizer
from chalicelib.constants import REQUEST_CONTENT_TYPE_JSON, ADMIN_ROLE
from chalice import Blueprint

from collections import defaultdict
from uuid import uuid4

from chalice import (
    NotFoundError,
    BadRequestError,
)
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    ADMIN_ROLE,
)
from datetime import datetime

question_routes = Blueprint(__name__)


@question_routes.route(
    "/",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_new_question():
    """Question route, testing purposes."""
    try:
        """`app.current_request.json_body` works because the request has the header `Content-Type: application/json` set."""
        incoming_json = question_routes.current_request.json_body
        # Check for all required fields
        if "question" not in incoming_json:
            raise BadRequestError("Key 'question' not found in incoming request")
        if "panelId" not in incoming_json:
            raise BadRequestError("Key 'panelId' not found in incoming request")

        user_id = question_routes.current_request.context["authorizer"]["principalId"]

        # Validate if panel still acepts questions!!

        # Build Question object for database
        new_question = {
            "QuestionID": str(uuid4()),
            "UserID": user_id,
            "PanelID": incoming_json["panelId"],
            "QuestionText": incoming_json["question"],
            "CreatedAt": datetime.now().isoformat(timespec="seconds"),
        }
        get_question_db().add_question(new_question)
        # Returns the result of put_item, kind of metadata and stuff
        return {
            "message": "Question successfully inserted in the DB",
            "QuestionID": new_question["QuestionID"],
        }

    except Exception as e:
        return {"error": str(e)}


@question_routes.route(
    "/",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_all_questions():
    """
    Question route, testing purposes.

    """
    user_id = question_routes.current_request.context["authorizer"]["principalId"]

    try:

        user_role = get_user_db().get_user_role(user_id)

        if user_role != ADMIN_ROLE:
            raise BadRequestError("Only admin can perform this action")

        questions = get_question_db().list_questions()
    except Exception as e:
        return {"error": str(e)}
    return questions


@question_routes.route(
    "/{id}",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_question(id):
    """
    Question route, testing purposes.
    """
    item = get_question_db().get_question(question_id=id)
    if item is None:
        raise NotFoundError("Question (%s) not found" % id)
    return item


@question_routes.route(
    "/mark_similar",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def retrieve_distributed_questions():
    # Request Format {"similar":["<id_1>", "<id_2>",..., "<id_n>"]}
    # for every question_id in the list, append to its "similar-to" lsit in the database with every other question_id
    try:
        request = question_routes.current_request.json_body
        similar_list = request["similar"]
        similar_set = set(similar_list)

        for id in similar_set:
            question_obj = get_question_db().get_question(id)
            if not question_obj:
                raise BadRequestError("Invalid question_id", id)
            other_ids = similar_set.copy()
            other_ids.remove(id)
            if "SimilarTo" in question_obj:
                question_obj["SimilarTo"].extend(
                    id for id in other_ids if id not in question_obj["SimilarTo"]
                )
            else:
                question_obj["SimilarTo"] = list(other_ids)
            get_question_db().add_question(question_obj)

        return f"{len(similar_list)} questions marked as similar"
    except Exception as e:
        return {"error": str(e)}


@question_routes.route(
    "/{id}/group_similar",
    methods=["GET"],
    authorizer=token_authorizer,
)
def group_similar_questions(id):
    try:
        questions = get_question_db().get_questions_by_panel(id)

        # Build adjacency list {<q_id> : [q_id1, q_id2, ..., q_idn]} for every q_id present in id
        adj_list = defaultdict(list)
        for question_obj in questions:
            if "SimilarTo" in question_obj:
                adj_list[question_obj["QuestionID"]] = question_obj["SimilarTo"]

        # DFS helper function
        def dfs(node, visited):
            if node in visited:
                return (False, None)

            visited.add(node)
            cluster = [node]
            for neighbor in adj_list[node]:
                if neighbor not in visited:
                    cluster.extend(dfs(neighbor, visited)[1])

            return (True, cluster)

        # Iterate through all questions and perform DFS
        similar_culsters = []
        visited = set()
        for question in questions:
            is_new, cluster = dfs(question["QuestionID"], visited)
            if is_new:
                similar_culsters.append(cluster)

        # TODO - Store similar_culsters "somewhere"

        return similar_culsters

    except Exception as e:
        return {"error": str(e)}
