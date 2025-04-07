const { PutItemCommand, DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { datadog } = require("datadog-lambda-js");
const { tracer } = require("dd-trace");

// 初始化 DataDog 跟踪
tracer.init({
  logInjection: true,
});

const client = new DynamoDBClient({});

exports.handler = datadog(async (event) => {
  try {
    const item = {
      id: { S: new Date().toISOString() },
      data: { S: JSON.stringify(event) },
    };

    await client.send(
      new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: item,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data stored successfully" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
});
