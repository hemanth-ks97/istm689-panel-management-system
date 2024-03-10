from datetime import datetime, timezone, timedelta
from jwt import decode, get_unverified_header, encode
from google.auth import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests

from .config import (
    JWT_SECRET,
    GOOGLE_AUTH_CLIENT_ID,
    ENV,
    JWT_AUDIENCE,
    JWT_ISSUER,
    JWT_TOKEN_EXPIRATION_DAYS,
)


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
        # TODO, make this more secure
        case s if s.endswith("pms-core"):
            # Decode our own token
            decoded_token = decode_and_validate_custom_token(token)
        case "https://accounts.google.com":
            # Decode Google Token
            decoded_token = decode_and_validate_google_token(token)
        case _:
            # Unknown issuer
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
