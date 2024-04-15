import boto3

from collections import defaultdict
from random import shuffle
from datetime import datetime, timezone, timedelta
from jwt import decode, get_unverified_header, encode
from google.auth import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests
from uuid import uuid4

from json import dumps, loads

from .constants import GOOGLE_ISSUER, BOTO3_S3_TYPE, BOTO3_DYNAMODB_TYPE

from chalicelib.database.db_provider import get_user_db, get_panel_db, get_question_db

from .config import (
    JWT_SECRET,
    GOOGLE_AUTH_CLIENT_ID,
    JWT_AUDIENCE,
    JWT_ISSUER,
    JWT_TOKEN_EXPIRATION_DAYS,
    PANELS_BUCKET_NAME,
)

s3_client = boto3.client(BOTO3_S3_TYPE)


def _generate_id():
    """Generate a unique id."""
    return str(uuid4())


def generate_user_id():
    """Generate a unique user id."""
    return f"u-{_generate_id()}"


def generate_question_id():
    """Generate a unique metric id."""
    return f"q-{_generate_id()}"


def generate_panel_id():
    """Generate a unique panel id."""
    return f"p-{_generate_id()}"


def generate_log_id():
    """Generate a unique log id."""
    return f"l-{_generate_id()}"


def decode_and_validate_google_token(token):
    request = requests.Request()
    try:
        return id_token.verify_oauth2_token(token, request, GOOGLE_AUTH_CLIENT_ID)
    except exceptions.GoogleAuthError:
        return None


def decode_and_validate_custom_token(token):
    try:
        header_data = get_unverified_header(token)
        return decode(
            token,
            JWT_SECRET,
            audience=JWT_AUDIENCE,
            algorithms=[
                header_data["alg"],
            ],
        )
    except:
        return None


def verify_token(token):
    decoded_token = None
    # Decode token without verifying signature to check issuer and decode it properly
    token_issuer = get_token_issuer(token)

    # We need these to check if we want to decode our own token or google token
    match token_issuer:
        case s if s == JWT_ISSUER:
            decoded_token = decode_and_validate_custom_token(token)
        case s if s == GOOGLE_ISSUER:
            # Decode Google Token
            decoded_token = decode_and_validate_google_token(token)
        case _:
            # Unknown or unauthorized issuer
            pass

    return decoded_token


def get_token_email(token):
    """Get the subject of the token, which is the user id."""
    unverified_token = unverified_decode(token)
    return unverified_token["email"]


def get_token_subject(token):
    """Get the subject of the token, which is the user id."""
    unverified_token = unverified_decode(token)
    return unverified_token["sub"]


def get_token_issuer(token):
    """Get the issuer of the token."""
    unverified_token = unverified_decode(token)
    return unverified_token["iss"]


def get_token_role(token):
    """Get the role of the token."""
    unverified_token = unverified_decode(token)
    return unverified_token["role"]


def unverified_decode(token):
    """Decode token without verifying signature. Used to get the issuer."""
    return decode(token, options={"verify_signature": False})


def get_base_url(request):
    """Get the base URL of the request. Can be used to create links in the response."""
    headers = request.headers
    base_url = "%s://%s" % (
        headers.get("x-forwarded-proto", "http"),
        headers["host"],
    )
    if "stage" in request.context:
        base_url = "%s/%s" % (base_url, request.context.get("stage"))
    return base_url


def create_token(user_id, email_id, name, picture, role):
    current_time = datetime.now(tz=timezone.utc)
    expiration = datetime.now(tz=timezone.utc) + timedelta(
        days=int(JWT_TOKEN_EXPIRATION_DAYS)
    )

    payload_data = {
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": current_time,
        "nbf": current_time,
        "exp": expiration,
        "sub": user_id,
        "email": email_id,
        "name": name,
        "picture": picture,
        "role": role,
    }

    token = encode(
        payload=payload_data,
        key=JWT_SECRET,
        algorithm="HS256",
    )

    return token


# DFS helper function for grouping similar questions
def dfs(node, visited, adj_list):
    if node in visited:
        return (False, None)

    visited.add(node)
    cluster = [node]
    for neighbor in adj_list[node]:
        if neighbor not in visited:
            cluster.extend(dfs(neighbor, visited, adj_list)[1])

    return (True, cluster)


def upload_objects(bucket_name, panel_id, file_name, json_object):
    """Upload objects to the bucket"""
    print("Start uploading objects to panels bucket")
    # The key for the object
    object_name = f"{panel_id}/{file_name}"

    # Convert the list to JSON format
    json_content = dumps(json_object, indent=2)

    # Upload the object
    try:
        s3_client.put_object(Bucket=bucket_name, Key=object_name, Body=json_content)
        print(f"Uploaded {object_name} successfully")
    except Exception as e:
        print(f"Error uploading {object_name}:", e)


def get_s3_objects(bucket_name, object_key):
    """Get Objects from the bucket"""
    print("Start getting objects from panels bucket")

    try:
        s3_object = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        object_data = loads(s3_object["Body"].read().decode("utf-8"))
        return object_data, None
    except s3_client.exceptions.NoSuchKey as e:
        print(f"No such {object_key} key found: {e}")
        return None, e
    except s3_client.exceptions.NoSuchBucket as e:
        print(f"No such {bucket_name} bucket: {e}")
        return None, e
    except Exception as e:
        print(f"Error getting {object_key}: {e}")
        return None, e


def get_current_time_utc():
    # Created a function to have standarize dates from the backend!
    # Get the current time in ISO format
    # Example: 2021-09-01T12:00:00Z
    return (
        datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    )


def distribute_tag_questions(panel_id):
    try:
        # Get list of all questions for that panel from the usersDB
        questions = get_question_db().get_questions_by_panel(panel_id)
        if questions is None:
            return f"Questions for Panel {id} not found"
        # Creating map to store questionID and corresponding userID
        question_map = {}

        # Get all questionIDs and corresponding UserID from questions
        for question in questions:
            question_id = question.get("QuestionID")
            user_id = question.get("UserID")
            question_text = question.get("QuestionText")
            question_map[question_id] = {
                "UserID": user_id,
                "QuestionText": question_text,
            }

        # Store all questionIDs from Map
        question_ids = list(question_map.keys())

        # Get total students from the usersDB
        student_ids = list(get_user_db().get_student_user_ids())
        number_of_questions = len(question_ids)
        number_of_students = len(student_ids)

        number_of_questions_submitted_per_student = get_panel_db().get_panel(panel_id).get("NumberOfQuestions")
        number_of_assignable_tag_questions_per_student = number_of_questions - number_of_questions_submitted_per_student
        number_of_tag_questions_per_student = min(number_of_assignable_tag_questions_per_student, 20)

        number_of_question_slots = number_of_tag_questions_per_student * number_of_students
        number_of_repetition_of_questions = (
            number_of_question_slots // number_of_questions
        )
        number_of_extra_question_slots = number_of_question_slots % number_of_questions

        # Print variable values
        print("Panel ID: ", panel_id)
        print("Number of questions submitted per student: ", number_of_questions_submitted_per_student)
        print("Number of questions to tag per student: ", number_of_tag_questions_per_student)
        print("Total number of questions: ", number_of_questions)
        print("Total number of students: ", number_of_students)
        print("Total number of question slots: ", number_of_question_slots)
        print("Number of extra question slots: ", number_of_extra_question_slots)

        # Distribute questions to slots
        distributed_question_id_slots = []

        # Append each question id to the list with repetitions
        for question_id in question_ids:
            distributed_question_id_slots.extend(
                [question_id] * number_of_repetition_of_questions
            )

        # Fill remaining slots with top question ids and append to the list
        if number_of_extra_question_slots > 0:
            top_questions = question_ids[:number_of_extra_question_slots]
            distributed_question_id_slots.extend(top_questions)

        # Shuffle the question slots to randomize the order
        shuffle(distributed_question_id_slots)

        # Create a collection to store questionSubLists
        student_id_questions_map = {}
        # counter = 0

        for _ in range(number_of_students):
            student_id = student_ids.pop(0)

            # Create a sublist for each iteration
            question_id_text_map = {}

            # Pop questions from the questions slot list to put in the map
            for _ in range(number_of_tag_questions_per_student):

                # Initialize counter
                counter = 0

                # Get next question from the questionID slot list
                question_id = distributed_question_id_slots.pop(0)

                # Check if question exists in the map keys and check if question was entered by user
                # (failure condition - skip to next question)
                while (question_id in question_id_text_map.keys()) or (
                        student_id == question_map[question_id]["UserID"]
                ):
                    # Append it to the end of the master list and fetch the next question
                    distributed_question_id_slots.append(question_id)

                    # Get next question from the questionID slot list
                    question_id = distributed_question_id_slots.pop(0)

                    # Increment counter
                    if counter > number_of_tag_questions_per_student:
                        break
                    else:
                        counter += 1

                # Add question to map
                question_id_text_map[question_id] = question_map[question_id][
                    "QuestionText"
                ]

            if len(question_id_text_map) == number_of_tag_questions_per_student:
                # Assign the sublist to the next available student ID
                student_id_questions_map[student_id] = question_id_text_map
            else:
                # Handle edge case where last student doesn't get questions
                distribute_tag_questions(panel_id)

            # Add the student_question_map to an S3 bucket
            upload_objects(PANELS_BUCKET_NAME, id, student_id_questions_map)

        return student_id_questions_map
    except Exception as e:
        return {"error": str(e)}


def group_similar_questions(panel_id):
    try:
        questions = get_question_db().get_questions_by_panel(panel_id)

        # Build adjacency list {<q_id> : [q_id1, q_id2, ..., q_idn]} for every q_id present in panel_id
        adj_list = defaultdict(list)
        for question_obj in questions:
            if "SimilarTo" in question_obj:
                adj_list[question_obj["QuestionID"]] = question_obj["SimilarTo"]

        # Iterate through all questions and perform DFS
        similar_culsters = []
        visited = set()
        for question in questions:
            is_new, cluster = dfs(question["QuestionID"], visited, adj_list)
            if is_new:
                similar_culsters.append(cluster)

        # Build hash-map of retrieved questions for faster lookup
        question_map = {}
        for question_obj in questions:
            question_map[question_obj["QuestionID"]] = question_obj

        # Pick representative question from each cluster of similar questions (highest likes)
        # Exclude flagged questions
        # Calculate total cluster likes
        # store it in a new list

        rep_question_clusters = []

        for cluster in similar_culsters:
            rep_id = cluster[0]
            rep_likes = 0
            cluster_likes = 0
            cluster_dislikes = 0
            filtered_cluster = []

            if len(cluster) > 1:
                for q_id in cluster:
                    if (
                        "FlaggedBy" not in question_map[rep_id]
                        or len(question_map[q_id]["FlaggedBy"]) == 0
                    ):
                        filtered_cluster.append(q_id)
                        q_likes = len(question_map[q_id]["LikedBy"])
                        q_dislikes = len(question_map[q_id]["DislikedBy"])
                        if q_likes > rep_likes:
                            rep_id = q_id
                            rep_likes = q_likes
                        cluster_likes += q_likes
                        cluster_dislikes += q_dislikes
            else:
                if (
                    "FlaggedBy" not in question_map[rep_id]
                    or len(question_map[rep_id]["FlaggedBy"]) == 0
                ):
                    filtered_cluster.append(rep_id)

            if len(filtered_cluster) > 0:
                rep_question_clusters.append(
                    {
                        "rep_id": rep_id,
                        "rep_question": question_map[rep_id]["QuestionText"],
                        "cluster": filtered_cluster,
                        "cluster_likes": cluster_likes,
                        "cluster_dislikes": cluster_dislikes,
                        "cluster_net_likes": cluster_likes - cluster_dislikes,
                    }
                )

        # Sort by net cluster likes in descending order
        sorted_by_net_cluster_likes = sorted(
            rep_question_clusters, key=lambda x: x["cluster_net_likes"], reverse=True
        )

        # Store top 20 clusters in S3
        upload_objects(
            PANELS_BUCKET_NAME,
            panel_id,
            "sortedCluster.json",
            sorted_by_net_cluster_likes[:20],
        )

        return sorted_by_net_cluster_likes

    except Exception as e:
        return {"error": str(e)}
