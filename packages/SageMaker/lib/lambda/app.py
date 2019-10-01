import logging
import boto3
import os

FILE_MODEL_NAME = os.environ['FILE_MODEL_NAME']
SOURCE_BUCKET = os.environ['SOURCE_BUCKET']
DESTINATION_BUCKET = os.environ['DESTINATION_BUCKET']

logging.basicConfig(
    level=logging.DEBUG,
    format='%(levelname)s: %(asctime)s: %(message)s'
)

client = boto3.client('s3')

def lambda_handler(event, context):
    logging.info("FILE_MODEL_NAME", FILE_MODEL_NAME)
    logging.info(event)
    logging.info(event['detail']['requestParameters']['key'])
    name = event['detail']['requestParameters']['key'].split("/")
    logging.info(name[-1])
    
    
    if name[-1] == FILE_MODEL_NAME:
        response = client.copy_object(
            Bucket=DESTINATION_BUCKET,
            CopySource={'Bucket': SOURCE_BUCKET, 'Key': event['detail']['requestParameters']['key']},
            Key=FILE_MODEL_NAME
        )
        logging.info(response)

    else:
        logging.info("Ignore the file")

