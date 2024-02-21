from chalice import Chalice, AuthResponse, CORSConfig
from chalicelib.config import ENV, GOOGLE_AUTH_CLIENT_ID, ALLOW_ORIGIN, ALLOWED_AUTHORIZATION_TYPES, ALLOWED_CLIENT_IDS
from google.auth import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests

app = Chalice(app_name=f"{ENV}-pms-core")

cors_config = CORSConfig(
    allow_origin=ALLOW_ORIGIN,
)

app.api.cors = cors_config

@app.authorizer()
def google_oauth2_authorizer(auth_request):
    allowed_routes = []
    principal_id = 'user'
    try:
        # Expects token in the "Authorization" header of incoming request ---> Format: "{"Authorization": "Bearer <token>"}" 
        # Extract the token from the incoming request
        auth_header = auth_request.token.split()
        # Check if authorization type is valid
        if auth_header[0] not in ALLOWED_AUTHORIZATION_TYPES:
            app.log.error(f"Invalid Authorization Header Type: {auth_header[0]}")
            raise ValueError('Could not verify authorization type')
        # Extract the token from the authorization header
        token = auth_header[1]
        # TODO: Check if it is a bearer token before trying to decode it
        # Validate the JWT token using Google's OAuth2 v2 API
        request = requests.Request()
        id_info = id_token.verify_oauth2_token(token, request, GOOGLE_AUTH_CLIENT_ID)
        # Validate the audience of the token
        if id_info['aud'] not in ALLOWED_CLIENT_IDS:
            raise ValueError('Could not verify audience')
        # Auth Type: Valid
        # Token: Valid
        # Audience: Valid
        # TODO: check allowed routes for specific user
        allowed_routes.append("*")
        principal_id=id_info['sub']
    except exceptions.GoogleAuthError as e:
        # Token is invalid
        app.log.error(f"Google Auth Error: {str(e)}")
    except Exception as e:
        #General catch statement for unexpected errors
        app.log.error(f"Unexpected Error: {str(e)}")
    # Single return for all cases
    return AuthResponse(routes=allowed_routes, principal_id=principal_id)

# Example protected route ---> REMOVE LATER
@app.route('/protected', authorizer=google_oauth2_authorizer)
def protectedHello():
    return{'hello': 'from protected world'}

@app.route('/')
def index():
    return {'hello': 'world'}

@app.route('/users', methods=['GET'], authorizer=google_oauth2_authorizer)
def users():
    return {'users': [{'name': 'Test', 'id': 'test@test.com'}, {'name': 'Test 2', 'id': 'test2@test.com'}]}


@app.route('/panel', methods=['GET'], authorizer=google_oauth2_authorizer)
def users():
    return {'panel': [{'name': 'Panel 1', 'id': '001'}, {'name': 'Panel 2', 'id': '002'}]}
