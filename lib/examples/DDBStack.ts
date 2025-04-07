// lib/dynamodb-nested-stack.ts
import * as cdk from "aws-cdk-lib";
// import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
// import * as path from 'path';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";

import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaPython } from "../constructs/lambda-python";
import { LambdaNodejs } from "../constructs/lambda-nodejs";
import { LambdaJava } from "../constructs/lambda-java";

export class DynamoDBNestedStack extends NestedStack {
  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const table = new dynamodb.Table(this, "MyTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
      timeToLiveAttribute: "ttl", // Optional: enable TTL
    });

    // Add GSI if needed
    table.addGlobalSecondaryIndex({
      indexName: "typeIndex",
      partitionKey: { name: "type", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
    });

    // Create Lambda function
    const pythonWriter = new LambdaPython(this, "pythonWriter", {
      lambdaFileName: "ddb",
      lambdaMethodName: "handler",
      service: "ddb-payload",
    });

    pythonWriter.addEnvironment("TABLE_NAME", table.tableName);
    pythonWriter.addEnvironment("REGION", cdk.Stack.of(this).region);
    pythonWriter.addEnvironment(
      "DD_TRACE_CLOUD_PAYLOAD_TAGGING_SERVICES",
      "dynamodb"
    );

    // Grant permissions to Lambda to write to DynamoDB
    table.grantWriteData(pythonWriter);

    const nodeWriter = new LambdaNodejs(this, "nodeWriter", {
      ddhandler: "app.lambdaHandler",
    });

    const nodefuntionurl = new LambdaNodejs(this, "nodefunctionurl", {
      ddhandler: "app.functionurl_handler",
    });

    const functionURL = nodefuntionurl.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // Public access
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ["*"],
      },
    });
    nodeWriter.addEnvironment("TABLE_NAME", table.tableName);
    nodeWriter.addEnvironment("REGION", cdk.Stack.of(this).region);
    nodeWriter.addEnvironment(
      "DD_TRACE_CLOUD_PAYLOAD_TAGGING_SERVICES",
      "dynamodb,ddb"
    );
    nodeWriter.addEnvironment("NODE18_HANDLER_URL", functionURL.url);

    // Grant permissions to Lambda to write to DynamoDB
    table.grantWriteData(nodeWriter);
    // Create an S3 bucket
    const bucket = new s3.Bucket(this, "ItemsBucket", {
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    // JAVA
    const javaWriter = new LambdaJava(this, "javaWriter", {
      handler: "example.DDBWriter",
      service: "joey-ddb-java",
    });
    javaWriter.addEnvironment("TABLE_NAME", table.tableName);
    javaWriter.addEnvironment("BUCKET_NAME", bucket.bucketName);

    table.grantWriteData(javaWriter);

    bucket.grantWrite(javaWriter);
  }
}
