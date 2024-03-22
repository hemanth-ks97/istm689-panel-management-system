from chalicelib.database.db_provider import get_user_db
from chalicelib.auth.token_authorizer import token_authorizer
from chalicelib.constants import (
    ADMIN_ROLE,
    STUDENT_ROLE,
)
from chalice import Blueprint
import uuid
import pandas as pd
from io import StringIO
from urllib.parse import quote

from chalice import (
    BadRequestError,
    Response,
)
from chalicelib.constants import (
    ADMIN_ROLE,
    STUDENT_ROLE,
)
from datetime import datetime

file_routes = Blueprint(__name__)


@file_routes.route(
    "/howdy",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=["text/plain"],
)
def post_howdy_csv():
    user_id = file_routes.current_request.context["authorizer"]["principalId"]
    try:

        user_role = get_user_db().get_user_role(user_id)

        # Should get authorizaed oaths from authorizer function

        if user_role != ADMIN_ROLE:
            raise BadRequestError("Only admin can perform this action")

        # Access the CSV file from the request body
        csv_data = file_routes.current_request.raw_body.decode("utf-8")

        # Convert the CSV file to a string
        csv_file = StringIO(csv_data)

        # Read CSV data into a pandas dataframe
        df = pd.read_csv(csv_file)

        # Rename columns according to user table schema
        df.rename(
            columns={"FIRST NAME": "FName", "LAST NAME": "LName", "EMAIL": "EmailID"},
            inplace=True,
        )

        # Replace "email.tamu.edu" with just "tamu.edu" in the email column
        df["EmailID"] = df["EmailID"].str.replace("email.tamu.edu", "tamu.edu")

        # Choosing relevant columns for adding records to the user_db
        records = df[["EmailID", "FName", "LName", "UIN"]].to_dict(orient="records")
        for record in records:
            user_exists = get_user_db().get_user_by_uin(record["UIN"])

            if not user_exists:
                # If the user does not exists, create a new one from scratch
                new_user = dict()
                new_user["UserID"] = str(uuid.uuid4())
                new_user["EmailID"] = record["EmailID"]
                new_user["FName"] = record["FName"]
                new_user["LName"] = record["LName"]
                new_user["UIN"] = record["UIN"]
                new_user["Role"] = STUDENT_ROLE
                new_user["CreatedAt"] = datetime.now().isoformat(timespec="seconds")
                new_user["UpdatedAt"] = datetime.now().isoformat(timespec="seconds")
                get_user_db().add_user(new_user)
            else:
                # The user already exists, should update some fields only
                updated_user = user_exists[0]
                updated_user["EmailID"] = record["EmailID"]
                updated_user["FName"] = record["FName"]
                updated_user["LName"] = record["LName"]
                updated_user["UpdatedAt"] = datetime.now().isoformat(timespec="seconds")
                get_user_db().update_user(updated_user)
        return Response(
            body={
                "message": f"Student data processed successfully with {len(df)} records"
            },
            status_code=200,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        return {"error": str(e)}


@file_routes.route(
    "/canvas",
    methods=["POST"],
    authorizer=token_authorizer,
    content_types=["text/plain"],
)
def post_canvas_csv():
    user_id = file_routes.current_request.context["authorizer"]["principalId"]
    try:
        user_role = get_user_db().get_user_role(user_id)

        if user_role != ADMIN_ROLE:
            raise BadRequestError("Only admin can perform this action")

        # Access the CSV file from the request body
        csv_data = file_routes.current_request.raw_body.decode("utf-8")

        # Convert the CSV file to a string
        csv_file = StringIO(csv_data)

        # Read CSV data into a pandas dataframe
        df = pd.read_csv(csv_file)

        # Rename columns according to user table schema
        df.rename(columns={"ID": "CanvasID", "SIS Login ID": "UIN"}, inplace=True)
        # Cleanup CanvasID NaN columns
        df["CanvasID"] = df["CanvasID"].replace("NaN", pd.NA).fillna(0).astype(int)
        # Cleanup UIN NaN columns
        df["UIN"] = df["UIN"].replace("NaN", pd.NA).fillna(0).astype(int)
        # Cleanup Section NaN columns
        df["Section"] = df["Section"].replace("NaN", "")
        # Remove rows with UIN = 0
        df = df[df["UIN"] != 0]

        # Choosing relevant columns for adding records to the user_db
        records = df[["CanvasID", "Section", "UIN"]].to_dict(orient="records")
        for record in records:
            user_exists = get_user_db().get_user_by_uin(record["UIN"])

            if not user_exists:
                # If the user does not exists, create a new one from scratch
                new_user = dict()
                new_user["UserID"] = str(uuid.uuid4())
                new_user["UIN"] = int(record["UIN"])
                new_user["Role"] = STUDENT_ROLE
                new_user["Section"] = record["Section"]
                new_user["CanvasID"] = int(record["CanvasID"])
                new_user["CreatedAt"] = datetime.now().isoformat(timespec="seconds")
                new_user["UpdatedAt"] = datetime.now().isoformat(timespec="seconds")
                get_user_db().add_user(new_user)
            else:
                # The user already exists, should update some fields only
                updated_user = user_exists[0]
                updated_user["Section"] = record["Section"]
                updated_user["CanvasID"] = int(record["CanvasID"])
                updated_user["UpdatedAt"] = datetime.now().isoformat(timespec="seconds")
                get_user_db().update_user(updated_user)
        return Response(
            body={
                "message": f"Student data processed successfully with {len(df)} records"
            },
            status_code=200,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        return {"error": str(e)}
