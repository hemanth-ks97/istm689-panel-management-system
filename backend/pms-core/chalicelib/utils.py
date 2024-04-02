from datetime import datetime, timezone, timedelta
from jwt import decode, get_unverified_header, encode
from google.auth import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests
from uuid import uuid4


import boto3


from json import dumps, loads

from .constants import GOOGLE_ISSUER, BOTO3_S3_TYPE

from .config import (
    JWT_SECRET,
    GOOGLE_AUTH_CLIENT_ID,
    JWT_AUDIENCE,
    JWT_ISSUER,
    JWT_TOKEN_EXPIRATION_DAYS,
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
