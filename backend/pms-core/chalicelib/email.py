import json
import boto3


def send_email(
    destination_addresses=[],
    subject="",
    body="",
):
    ses = boto3.client("ses")

    response = ses.send_email(
        Destination={"ToAddresses": destination_addresses},
        Message={
            "Body": {
                "Text": {
                    "Charset": "UTF-8",
                    "Data": body,
                }
            },
            "Subject": {
                "Charset": "UTF-8",
                "Data": subject,
            },
        },
        Source="anshita.gupta@tamu.edu",
    )

    return {
        "statusCode": 200,
        "body": json.dumps(
            "Email Sent Successfully. MessageId is: " + response["MessageId"]
        ),
    }
