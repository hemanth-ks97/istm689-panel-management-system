from json import dumps
from boto3 import client
from .constants import BOTO3_SES_TYPE
from .config import SES_EMAIL_ADDRESS, SES_IS_SANDBOX


def send_email(
    destination_addresses=[],
    cc_addresses=[],
    bcc_addresses=[],
    subject="",
    html_body="",
    text_body="",
):
    ses = client(BOTO3_SES_TYPE)

    final_destination_addresses = destination_addresses
    final_cc_addresses = cc_addresses
    final_bcc_addresses = bcc_addresses

    if SES_IS_SANDBOX:
        # If SES is still in sandbox, we can only send to verified email addresses
        # We added an override to send emails so it does not crash
        final_destination_addresses = [SES_EMAIL_ADDRESS]
        final_cc_addresses = [SES_EMAIL_ADDRESS]
        final_bcc_addresses = [SES_EMAIL_ADDRESS]

    response = ses.send_email(
        Destination={
            "ToAddresses": final_destination_addresses,
            "CcAddresses": final_cc_addresses,
            "BccAddresses": final_bcc_addresses,
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
        Source=SES_EMAIL_ADDRESS,
    )

    return {
        "statusCode": 200,
        "body": dumps(
            "Email Sent Successfully. MessageId is: " + response["MessageId"]
        ),
    }
