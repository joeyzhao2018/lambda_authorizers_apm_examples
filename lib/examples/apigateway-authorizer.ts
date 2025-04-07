import * as apigateway from 'aws-cdk-lib/aws-apigateway';

import { Construct } from 'constructs';
import {
    aws_iam,
    NestedStack,
    NestedStackProps
} from "aws-cdk-lib";

import { LambdaPython } from "../constructs/lambda-python";

export class ApiGatewayStack extends NestedStack {
    constructor(scope: Construct, id: string, props: NestedStackProps) {
        super(scope, id, props);

        // Lambda Authorizer
        const authorizer = new LambdaPython(this, 'AuthorizerFunction', {
            lambdaFileName: 'authorizer',
            lambdaMethodName: 'handler',
            service: "apigateway-authorizer-lambda-authorizer"
        });

        // Lambda Function 1 (handles API Gateway A requests)
        const lambdaOne = new LambdaPython(this, 'LambdaOne', {
            lambdaFileName: "apigateway_lambda1",
            lambdaMethodName: "handler",
            service: "apigateway-authorizer-lambda-1"
        });
        lambdaOne.addEnvironment("API_GATEWAY_B_URL", "");

        // Lambda Function 2 (handles API Gateway B requests)
        const lambdaTwo =  new LambdaPython(this, 'LambdaTwo', {
            lambdaFileName: "apigateway_lambda2",
            lambdaMethodName: "handler",
            service: "apigateway-authorizer-lambda-2"
        });

        // API Gateway B
        const apiGatewayB = new apigateway.RestApi(this, 'ApiGatewayB', {
            restApiName: 'API Gateway B',
            description: 'API Gateway B handled by Lambda Two',
        });

        const integrationB = new apigateway.LambdaIntegration(lambdaTwo);
        apiGatewayB.root.addMethod('POST', integrationB);

        // Update Lambda One's environment with API Gateway B URL
        lambdaOne.addEnvironment(
            'API_GATEWAY_B_URL',
            apiGatewayB.url
        );

        // API Gateway A with Lambda Authorizer
        const apiGatewayA = new apigateway.RestApi(this, 'ApiGatewayA', {
            restApiName: 'API Gateway A',
            description: 'API Gateway A handled by Lambda One with Authorizer',
        });

        // Create Lambda authorizer
        const lambdaAuthorizer = new apigateway.TokenAuthorizer(this, 'ApiAuthorizer', {
            handler: authorizer,
            identitySource: apigateway.IdentitySource.header('Authorization'),
        });

        const integrationA = new apigateway.LambdaIntegration(lambdaOne);
        apiGatewayA.root.addMethod('POST', integrationA, {
            authorizer: lambdaAuthorizer,
        });

        // Grant permissions
        lambdaOne.addToRolePolicy(new aws_iam.PolicyStatement({
            actions: ['execute-api:Invoke'],
            resources: [apiGatewayB.arnForExecuteApi()],
        }))
    }
}
