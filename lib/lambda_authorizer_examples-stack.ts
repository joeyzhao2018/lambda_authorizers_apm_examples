import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import { ApiGatewayStack} from "./examples/apigateway-authorizer";
// import { RetryNestedStack } from "./nestedStacks/retry_stack";
// import { LoopBackNestedStack } from "./nestedStacks/loop_back_stack";
// import { SqsRelatedStack } from "./nestedStacks/sqs_related_stack";

// import { DistributedMapStateStack } from "./nestedStacks/distributed_mapstate_stack";
// import { StepLambdaLambdaStack } from "./nestedStacks/step_lambda_lambda_stack";
// import { ErrorStack } from "./nestedStacks/error_stack";
import { DynamoDBNestedStack } from "./examples/DDBStack";
export class LambdaAuthorizerExamplesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const retryStack = new RetryNestedStack(this, "retryExample", {});
    // const loopBackStack = new LoopBackNestedStack(this, "LoopBackExample", {});
    // const sqsRelatedStack = new SqsRelatedStack(this, "SqsRelatedStack", {});
    // const distributedMapStateStack = new DistributedMapStateStack(
    //   this,
    //   "distMapStateStack",
    //   {}
    // );

    // const errorStack = new ErrorStack(this, "errorStack", {});
    // const stepLambdaLambdaStack = new StepLambdaLambdaStack(
    //   this,
    //   "stepLambdaLambdaStack",
    //   {}
    // );
    // const apiGateWay = new ApiGatewayStack(this, "apigateway-authorizer", {});
    const ddbstack = new DynamoDBNestedStack(this, "ddb-stack", {});
    // cdk.Tags.of(distributedMapStateStack).add("DD_PRESERVE_STACK", "true");
    // cdk.Tags.of(errorStack).add("DD_PRESERVE_STACK", "true");
    // cdk.Tags.of(apiGateWay).add("DD_PRESERVE_STACK", "true");
    cdk.Tags.of(ddbstack).add("DD_PRESERVE_STACK", "true");
  }
}
