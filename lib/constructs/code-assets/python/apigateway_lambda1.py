import json
import os
import boto3
import urllib3

def handler(event, context):
    try:
        # Get the API Gateway B URL from environment variables
        api_gateway_b_url = os.environ['API_GATEWAY_B_URL']

        # Get the request body from API Gateway A
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)

        # Forward the request to API Gateway B
        http = urllib3.PoolManager()
        response = http.request(
            'POST',
            api_gateway_b_url,
            body=json.dumps(body),
            headers={'Content-Type': 'application/json'}
        )

        # Process the response from API Gateway B
        response_data = json.loads(response.data.decode('utf-8'))

        return {
            'statusCode': response.status,
            'body': json.dumps(response_data),
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
