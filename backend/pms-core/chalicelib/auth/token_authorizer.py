from chalice import Blueprint
from chalicelib.config import (
    ALLOWED_AUTHORIZATION_TYPES,
)
from chalicelib.utils import (
    verify_token,
    get_token_subject,
)
from chalice import (
    AuthResponse,
)
from google.auth import exceptions

auth_routes = Blueprint(__name__)


@auth_routes.authorizer()
def token_authorizer(auth_request):
    """
    Lambda function to check authorization of incoming requests.
    """
    allowed_routes = []
    principal_id = "unspecified"
    try:
        # Expects token in the "Authorization" header of incoming request
        # ---> Format: "{"Authorization": "Bearer <token>"}"
        # Extract the token from the incoming request
        auth_header = auth_request.token.split()
        auth_token_type = auth_header[0]

        # Check if authorization type is valid
        if auth_token_type not in ALLOWED_AUTHORIZATION_TYPES:
            # app.log.error(f"Invalid Authorization Header Type: {auth_token_type}")
            raise ValueError("Could not verify authorization type")

        # Extract the token from the authorization header
        token = auth_header[1]

        decoded_token = verify_token(token)

        if decoded_token is None:
            raise ValueError("Invalid or Expired Token")

        # At this point the token is valid and verified
        # Proceed to fetch user roles and match allowed routes

        # Here we need to check for the role of the current user
        # assign the allowed routes based on the role
        # Should not check for it on the endpoint
        allowed_routes.append("*")

        principal_id = get_token_subject(token)

    except exceptions.GoogleAuthError as e:
        # Token is invalid
        print(f"Google Auth Error: {str(e)}")
    except Exception as e:
        # General catch statement for unexpected errors
        print(f"Unexpected Error: {str(e)}")
    # Single return for all cases
    return AuthResponse(routes=allowed_routes, principal_id=principal_id)
