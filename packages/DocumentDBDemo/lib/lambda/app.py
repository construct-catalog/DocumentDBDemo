import pymongo
import sys
import os
import json
import boto3

USER_NAME = os.environ['USER_NAME']
PASSWORD = os.environ['PASSWORD']
ENDPOINT = os.environ['ENDPOINT']
PORT = os.environ['PORT']
docDB_client_string = 'mongodb://{}:{}@{}:{}/?ssl=true&ssl_ca_certs=rds-combined-ca-bundle.pem&replicaSet=rs0'.format(USER_NAME, PASSWORD, ENDPOINT, PORT)


def lambda_handler(event, context):
    client = pymongo.MongoClient(docDB_client_string)
    db = client.test
    col = db.myTestCollection

    response = None
    if event['httpMethod'] == "POST":
        x: pymongo.collection.InsertOneResult = col.insert_one(json.loads(event['body']))
        response = json.dumps({"id": str(x.inserted_id)})
    if event['httpMethod'] == "GET":
        x = col.find_one(event['queryStringParameters'])
        response = str(x)

    client.close()
    return {
        'statusCode': 200,
        'body': response
    }
