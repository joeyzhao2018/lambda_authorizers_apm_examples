import json
import os
import boto3
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    try:
        # Get the request body
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)

        # Generate unique ID and timestamp
        item_id = str(uuid.uuid4())
        current_time = datetime.utcnow().isoformat()

        # Prepare item for DynamoDB
        item = {
            'id': item_id,
            'type': body.get('type', 'default_type1'),
            'data': body.get('data', {}),
            'createdAt': current_time,
            'ttl': body.get('ttl'),  # Optional: TTL timestamp in seconds
        }

        # Write to DynamoDB
        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Item successfully written to DynamoDB',
                'itemId': item_id
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }

    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f"DynamoDB error: {str(e)}"
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
