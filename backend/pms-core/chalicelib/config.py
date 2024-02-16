import os

# Fetches form enviroment variables or sets default local development values
ENV = os.environ.get('ENV', "local")
GOOGLE_AUTH_CLIENT_ID = os.environ.get('GOOGLE_AUTH_CLIENT_ID', "370940936724-4qh7n4qh6vrgli6bsf3je6kbe2lsotef.apps.googleusercontent.com")
ALLOW_ORIGIN = os.environ.get('ALLOW_ORIGIN', "http://localhost:3000")

# Can add more later, like basic auth for development purposes, etc
ALLOWED_AUTHORIZATION_TYPES = ('Bearer')
