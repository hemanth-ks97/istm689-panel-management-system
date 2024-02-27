from jwt import decode, get_unverified_header
from google.auth import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests

from .config import JWT_SECRET, GOOGLE_AUTH_CLIENT_ID, ENV


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
            audience="local-pms-core",
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
        case "local-pms-core":
            print("HEREEEEE")
            # Own token with our data!
            decoded_token = decode_and_validate_custom_token(token)
            print(decoded_token)

        case "https://accounts.google.com":
            print("HERE")

            # Google token with Google's data
            decoded_token = decode_and_validate_google_token(token)
        case _:
            print("here")
            # Unknown issuer
            # pass

    if decoded_token is None:
        return False
    else:
        return True


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


def unverified_decode(token):
    """Decode token without verifying signature. Used to get the issuer."""
    return decode(token, options={"verify_signature": False})
