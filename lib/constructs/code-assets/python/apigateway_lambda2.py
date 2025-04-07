import json

def handler(event, context):
    try:
        # Get the request body
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)

        # Process the request (replace with your business logic)
        result = {
            'message': 'Successfully processed by Lambda Two',
            'received_data': body
        }

        return {
            'statusCode': 200,
            'body': json.dumps(result),
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
