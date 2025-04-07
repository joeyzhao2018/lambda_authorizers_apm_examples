// app.mjs
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Create a DynamoDB client
const dynamoDBClient = new DynamoDBClient({});
const node18HandlerUrl = process.env.NODE18_HANDLER_URL;
// Create a DocumentClient wrapper
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);
const makeRequest = async (targetUrl, method, data) => {
  try {
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(targetUrl, options);
    const responseText = await response.text();

    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch (e) {
      responseBody = responseText;
    }

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
};

export const lambdaHandler = async (event) => {
  // Prepare request data
  const method = event.method || "GET";
  const payload = event.payload || {};

  // Make the request to the target handler
  const response = await makeRequest(node18HandlerUrl, method, payload);

  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      id: event.id || Date.now().toString(), // Auto-generate ID if not provided
      name: event.name,
      email: event.email,
      createdAt: new Date().toISOString(),
    },
  };

  try {
    // Use the DocumentClient to put an item
    await docClient.send(new PutCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: response.body,
        item: params.Item,
      }),
    };
  } catch (error) {
    console.error("Error writing to DynamoDB: are you serious?", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create item" }),
    };
  }
};


export const functionurl_handler = async (event) => {
  console.log(
    "Node.js 18 Handler received event:",
    JSON.stringify(event, null, 2)
  );

  const body = event.body ? JSON.parse(event.body) : {};
  const queryParams = event.queryStringParameters || {};

  // Process the request
  const response = {
    runtime: "nodejs18.x",
    message: "Hello from Node.js 18 Handler!",
    timestamp: new Date().toISOString(),
    receivedBody: body,
    receivedQueryParams: queryParams,
    requestMethod: event.requestContext?.http?.method || "UNKNOWN",
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(response, null, 2),
  };
};
