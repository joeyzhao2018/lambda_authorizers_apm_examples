const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    // Configure CloudWatch logging
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // Parse the incoming event body if it exists
        const item = event.body ? JSON.parse(event.body) : event;

        // Add timestamp for record keeping
        item.timestamp = new Date().toISOString();

        // DynamoDB put parameters
        const params = {
            TableName: process.env.TABLE_NAME, // Define this in Lambda environment variables
            Item: item,
            // Optional: Add condition expression to prevent overwriting existing items
            // ConditionExpression: 'attribute_not_exists(id)'
        };

        // Write to DynamoDB
        await dynamoDB.put(params).promise();

        console.log('Successfully wrote item:', JSON.stringify(item, null, 2));

        // Return success response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Item successfully created',
                item: item
            })
        };

    } catch (error) {
        console.error('Error:', error);

        // Return error response
        return {
            statusCode: error.statusCode || 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Error creating item',
                errorMessage: error.message,
                errorType: error.name
            })
        };
    }
};
