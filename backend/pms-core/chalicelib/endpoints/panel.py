from chalicelib.database.db_provider import (
    get_panel_db,
    get_user_db,
    get_question_db,
    get_metric_db,
)
from collections import Counter
from itertools import chain
from random import shuffle
from chalicelib.auth.token_authorizer import token_authorizer
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    ADMIN_ROLE,
)
from chalice import Blueprint
import uuid
from chalice import (
    BadRequestError,
    Response,
)
from chalicelib.constants import (
    REQUEST_CONTENT_TYPE_JSON,
    ADMIN_ROLE,
)
from datetime import datetime

panel_routes = Blueprint(__name__)


@panel_routes.route("/", authorizer=token_authorizer, methods=["GET"])
def get_all_panels():
    user_id = panel_routes.current_request.context["authorizer"]["principalId"]
    try:
        user_role = get_user_db().get_user_role(user_id)

        if user_role == ADMIN_ROLE:
            panels = get_panel_db().get_all_panels()
        else:
            panels = get_panel_db().get_public_panels()

        # Check user role

    except Exception as e:
        return {"error": str(e)}

    return panels


@panel_routes.route(
    "/",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_panel_info():
    user_id = panel_routes.current_request.context["authorizer"]["principalId"]
    try:
        user_role = get_user_db().get_user_role(user_id)

        if user_role != ADMIN_ROLE:
            raise BadRequestError("Only admin can perform this action")

        incoming_json = panel_routes.current_request.json_body

        new_panel = {
            "PanelID": str(uuid.uuid4()),
            "NumberOfQuestions": incoming_json["numberOfQuestions"],
            "PanelName": incoming_json["panelName"],
            "Panelist": incoming_json["panelist"],
            "QuestionStageDeadline": incoming_json["questionStageDeadline"],
            "VoteStageDeadline": incoming_json["voteStageDeadline"],
            "TagStageDeadline": incoming_json["tagStageDeadline"],
            "PanelVideoLink": incoming_json["panelVideoLink"],
            "PanelPresentationDate": incoming_json["panelPresentationDate"],
            "PanelDesc": incoming_json["panelDesc"],
            "PanelStartDate": incoming_json["panelStartDate"],
            "Visibility": incoming_json["visibility"],
            "CreatedAt": datetime.now().isoformat(timespec="seconds"),
        }
        get_panel_db().add_panel(new_panel)

        # We don't know if we added the panel successfully
        return Response(
            body={"message": "Panel added successfully"},
            status_code=200,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        return {"error": str(e)}


@panel_routes.route(
    "/{id}",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_panel(id):
    # Fetch user id
    user_id = panel_routes.current_request.context["authorizer"]["principalId"]
    try:
        user_role = get_user_db().get_user_role(user_id)
        panel = get_panel_db().get_panel(id)

        if user_role != ADMIN_ROLE and panel["Visibility"] == "internal":
            raise BadRequestError("Only admin can view this panel")

        return panel

    except Exception as e:
        return {"error": str(e)}


@panel_routes.route(
    "/{id}/questions",
    methods=["GET"],
    authorizer=token_authorizer,
)
def get_questions_by_panel(id):
    try:
        questions = get_question_db().get_questions_by_panel(id)
    except Exception as e:
        return {"error": str(e)}

    return questions


@panel_routes.route(
    "/{id}/metrics",
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


@panel_routes.route(
    "/{id}/distribute",
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
        shuffle(distributed_question_id_slots)

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
            chain.from_iterable(student_id_question_ids_map.values())
        )

        # TODO - Add the student_question_map to an S3 bucket

        return question_id_repetition_count_map, student_id_question_ids_map
    except Exception as e:
        return {"error": str(e)}
