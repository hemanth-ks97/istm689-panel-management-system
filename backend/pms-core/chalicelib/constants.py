"""File containing constant values."""

# Authorization Types
AUTH_BEARER_TYPE = "Bearer"
AUTH_BASIC_TYPE = "Basic"
# BOTO3 Resource Types
BOTO3_DYNAMODB_TYPE = "dynamodb"
BOTO3_SES_TYPE = "ses"
BOTO3_S3_TYPE = "s3"
# Request Content Types
REQUEST_CONTENT_TYPE_JSON = "application/json"

ADMIN_ROLE = "admin"
STUDENT_ROLE = "student"
PANELIST_ROLE = "panelist"

GOOGLE_ISSUER = "https://accounts.google.com"

STUDENT_ROLE_AUTHORIZE_ROUTES = [
    "/me",
    "/panel",
    "/panel/*",
    "/question/batch",
    "/metric/final",
    "/my/metrics",
]


ADMIN_ROLE_AUTHORIZE_ROUTES = [
    "/me",
    "/file",
    "/file/*",
    "/user",
    "/user/*",
    "/question",
    "/question/*",
    "/panel",
    "/panel/*",
    "/metric",
    "/metric/*",
]
# TODO
PANELIST_ROLE_AUTHORIZE_ROUTES = ["/me", "/panelist", "/panelist/*"]

GOOGLE_RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

# Score for only submitting questions
submit_score = 20
# Score for performace of the question
performance_score = 10
#Total score possible for questions
total_question_score = 40
# Points for overall engagement during tagging
engagement_score_tag = 10
# Points for overall engagement during voting
engagement_score_vote = 10
# Points for tagging all questions
tagging_score = 30
# Points for voting all questions
voting_score = 10

# Penalty rate
penalty_rate = 5

# Points if question is between +1 and -1 std deviation of likes
std_question_score = 5
# Points if question is above +1 std deviation of likes
above_std_score = 5
# Points for question if it is in voting stage
extra_voting_score = 5
# Points if question is selected in top 10 of voting - offset for any activity
top_questions_score = 5

total_score = 100

# Grade = (Questions) + (Tagging) + (Voting) = 100
# Overall Bonus that can be earned = 20
