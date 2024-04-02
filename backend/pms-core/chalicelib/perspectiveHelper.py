from googleapiclient import discovery
import json

API_KEY = "AIzaSyBVl4mV3sv1w9fMLa03OhBR859iOA_lx94"

client = discovery.build(
    "commentanalyzer",
    "v1alpha1",
    developerKey=API_KEY,
    discoveryServiceUrl="https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1",
    static_discovery=False,
)

"""
Return the max score for the below sentiments
If the call to api fails, we want the operation to still continue 
In such a case, return the default score of 0
"""
def get_question_sentiment(questionString):    
    score = 0
    analyze_request = {
        "comment": {"text": questionString},
        "requestedAttributes": {
            "TOXICITY": {},
            "SEVERE_TOXICITY": {},
            "IDENTITY_ATTACK": {},
            "INSULT": {},
            "PROFANITY": {},
            "THREAT": {},
        },
    }    
    try:
        print("***calling api***")
        response = client.comments().analyze(body=analyze_request).execute()
        print(json.dumps(response, indent=2))
        score = max(
        attribute['summaryScore']['value'] 
        for attribute in response['attributeScores'].values()
    )
        return score*100
    except Exception as e:        
        print("Something went wrong while calling perspective api call ", e)        
        return score*100
    

def is_question_ok(questionString):
    score = get_question_sentiment(questionString)
    if score >= 50:
        return False
    return True
