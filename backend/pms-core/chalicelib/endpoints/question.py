from chalicelib.database.db_provider import get_panel_db, get_user_db, get_question_db
from chalicelib.auth.token_authorizer import token_authorizer
from chalicelib.constants import REQUEST_CONTENT_TYPE_JSON, ADMIN_ROLE
from chalice import Blueprint
import itertools
from collections import Counter
import uuid
import random
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
    "/question",
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
            "QuestionID": str(uuid.uuid4()),
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
    "/question",
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
    "/question/{id}",
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
    "/panel/{id}/questions",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_questions_by_panel(id):
    try:
        questions = get_question_db().get_questions_by_panel(id)
    except Exception as e:
        return {"error": str(e)}

    return questions


@question_routes.route(
    "/panel/{id}/distribute",
    methods=["GET"],
    authorizer=token_authorizer,
)
def distribute_tag_questions(id):
    try:
        # Get list of all questions for that panel from the usersDB
        questions = get_questions_by_panel(id)

        # Creating map to store questionID and corresponding userID
        question_id_user_id_map = {}

        # Get all questionIDs and corresponding UserID from questions
        for question in questions:
            question_id_user_id_map[question.get("QuestionID")] = question.get("UserID")

        # Store all questionIDs from Map
        question_ids = list(question_id_user_id_map.keys())

        # Get total students from the usersDB
        student_ids = list(get_user_db().get_student_user_ids())
        number_of_questions_per_student = (
            get_panel_db().get_number_of_questions_by_panel_id(id)[0]
        )
        number_of_questions = len(question_ids)
        number_of_students = len(student_ids)
        number_of_question_slots = number_of_questions_per_student * number_of_students
        min_repetition_of_questions = number_of_question_slots // number_of_questions
        number_of_extra_question_slots = number_of_question_slots % number_of_questions

        # Print variable values
        print("Number of questions per student: ", number_of_questions_per_student)
        print("Total number of questions: ", number_of_questions)
        print("Total number of students: ", number_of_students)
        print("Total number of question slots: ", number_of_question_slots)
        print("Minimum repetition of questions: ", min_repetition_of_questions)
        print("Number of extra question slots: ", number_of_extra_question_slots)

        # Distribute questions to slots
        distributed_question_id_slots = []

        # Append each question id to the list with repetitions
        for question_id in question_ids:
            distributed_question_id_slots.extend(
                [question_id] * min_repetition_of_questions
            )

        # Fill remaining slots with top question ids and append to the list
        if number_of_extra_question_slots > 0:
            top_questions = question_ids[:number_of_extra_question_slots]
            distributed_question_id_slots.extend(top_questions)

        # Shuffle the question slots to randomize the order
        random.shuffle(distributed_question_id_slots)

        # Create a collection to store questionSubLists
        student_id_question_ids_map = {}

        for _ in range(number_of_students):
            student_id = student_ids.pop(0)

            # Create a sublist for each iteration
            question_id_sublist = []

            # Pop questions from the questions slot list to put in the sublist
            for _ in range(number_of_questions_per_student):
                question_id = distributed_question_id_slots.pop(0)

                # Check uniqueness in the sublist and check if question was entered by user
                while (question_id in question_id_sublist) or (
                    student_id == question_id_user_id_map.get(question_id)
                ):

                    # Append it to the end of the master list and fetch the next question
                    distributed_question_id_slots.append(question_id)

                    # Get next question from the questions list
                    question_id = distributed_question_id_slots.pop(0)

                # Add question to sublist
                question_id_sublist.append(question_id)

            # Assign the sublist to the next available student ID
            student_id_question_ids_map[student_id] = question_id_sublist

        question_id_repetition_count_map = Counter(
            itertools.chain.from_iterable(student_id_question_ids_map.values())
        )

        # TODO - Add the student_question_map to an S3 bucket

        return question_id_repetition_count_map, student_id_question_ids_map
    except Exception as e:
        return {"error": str(e)}
