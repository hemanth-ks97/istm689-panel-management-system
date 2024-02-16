from chalice import Chalice, AuthResponse
import google.auth.transport.requests
import google.oauth2.id_token
from google.auth import exceptions
import os

# Enviroment variables with default values
ENV = os.environ.get('ENV', "dev")
GOOGLE_AUTH_CLIENT_ID = os.environ.get('GOOGLE_AUTH_CLIENT_ID', "370940936724-4qh7n4qh6vrgli6bsf3je6kbe2lsotef.apps.googleusercontent.com")

app = Chalice(app_name=f"{ENV}-pms-core")

@app.authorizer()
def google_oauth2_authorizer(auth_request):
    # Expects token in the "Authorization" header of incoming request ---> Format: "{"Authorization": "<token>"}" 
    token = (auth_request.token)
    try:
        # Validate the JWT token using Google's OAuth2 v2 API
        request = google.auth.transport.requests.Request()
        id_info = google.oauth2.id_token.verify_oauth2_token(token, request, GOOGLE_AUTH_CLIENT_ID)
        
        # Token is valid, so return an AuthResponse with routes accessible
        return AuthResponse(routes=['*'], principal_id=id_info['sub'])
    except exceptions.GoogleAuthError as e:
        # Token is invalid
        app.log.error(f"Google Auth Error: {str(e)}")
    except Exception as e:
        #General catch statement for unexpected errors
        app.log.error(f"Unexpected Error: {str(e)}")
    return AuthResponse(routes=[], principal_id='user')

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

# The view function above will return {"hello": "world"}
# whenever you make an HTTP GET request to '/'.
#
# Here are a few more examples:
#
# @app.route('/hello/{name}')
# def hello_name(name):
#    # '/hello/james' -> {"hello": "james"}
#    return {'hello': name}

# @app.route('/users', methods=['POST'])
# def create_user():
#     # This is the JSON body the user sent in their POST request.
#     user_as_json = app.current_request.json_body
#     # We'll echo the json body back to the user in a 'user' key.
#     return {'user': user_as_json}

# See the README documentation for more examples.
#
