from json import dumps
from boto3 import client
from .constants import BOTO3_SES_TYPE


def send_email(
    destination_addresses=[],
    bcc_addresses=[],
    subject="",
    html_body="",
    text_body="",
):
    ses = client(BOTO3_SES_TYPE)

    response = ses.send_email(
        Destination={
            "ToAddresses": destination_addresses,
            "BccAddresses": bcc_addresses,
        },
        Message={
            "Body": {
                "Html": {
                    "Charset": "UTF-8",
                    "Data": html_body,
                },
                "Text": {
                    "Charset": "UTF-8",
                    "Data": text_body,
                },
            },
            "Subject": {
                "Charset": "UTF-8",
                "Data": subject,
            },
        },
        Source="davidgomilliontest@gmail.com",
    )

    return {
        "statusCode": 200,
        "body": dumps(
            "Email Sent Successfully. MessageId is: " + response["MessageId"]
        ),
    }
