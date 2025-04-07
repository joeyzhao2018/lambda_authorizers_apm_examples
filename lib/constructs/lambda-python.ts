import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { DD_API_KEY, getCodeAssetsPath } from "./common";
import { Duration, DockerVolume } from "aws-cdk-lib";
import {
  PythonFunction,
  PythonFunctionProps,
} from "@aws-cdk/aws-lambda-python-alpha";
import { dirname, join } from "path";
export interface LambdaPythonProps {
  lambdaFileName: string; // without .py
  lambdaMethodName: string;
  service?: string;
  timeout?: Duration;
  ddTracing?: boolean;
  xrayTracing?: lambda.Tracing;
}

// We are extending PythonFunction from @aws-cdk/aws-lambda-python-alpha here
// because it help simplify the dependency packaging.
// See more in code - assests/python/README.md

export class LambdaPython extends PythonFunction {
  constructor(scope: Construct, id: string, props: LambdaPythonProps) {
    const ddTracePath =
      "/Users/joey.zhao/go/src/github.com/DataDog/dd-trace-py";
    const datadogLambdaPath =
      "/Users/joey.zhao/go/src/github.com/DataDog/datadog-lambda-python";
    const parentDir = "/Users/joey.zhao/go/src/github.com/DataDog";
    const preConfigs: PythonFunctionProps = {
      runtime: lambda.Runtime.PYTHON_3_10,
      // handler: "datadog_lambda.handler.handler", // The layer will add this
      entry: join(dirname(__filename), "code-assets/python"),
      index: props.lambdaFileName + ".py",
      environment: {
        DD_API_KEY,
        DD_SERVICE: props.service || id,
        DD_SITE: "datadoghq.com",
        DD_TRACE_ENABLED: props.ddTracing ? props.ddTracing.toString() : "true",
        DD_LAMBDA_HANDLER: props.lambdaFileName + "." + props.lambdaMethodName,
        DD_TRACE_MANAGED_SERVICES: "true",
        DD_COLD_START_TRACING: "false",
        DD_ENV: id,
      },
      timeout: props.timeout || Duration.seconds(30),
      tracing: props.xrayTracing || lambda.Tracing.DISABLED,
      memorySize: 256,
      bundling: {
        volumes: [
          {
            hostPath: parentDir,
            containerPath: "/mnt/datadog",
          },
        ],
        command: [
          "bash",
          "-c",
          [
            "cp -r /asset-input/* /asset-output/",
            "pip install -r requirements.txt -t /asset-output", // Install from requirements.txt
            "cp -R /mnt/datadog/dd-trace-py/ddtrace /asset-output/ddtrace",
            "cp -R /mnt/datadog/datadog-lambda-python/datadog_lambda /asset-output/datadog_lambda",
          ].join(" && "),
        ],
        assetExcludes: [".venv", "__pycache__"],
      },
    };

    // Customized Props Overriding Pre-Configured Props
    const merged_props = {
      ...preConfigs,
      ...props,
    };
    super(scope, id, merged_props);
    const layers = [
      lambda.LayerVersion.fromLayerVersionArn(
        this,
        "extension",
        "arn:aws:lambda:ca-central-1:464622532012:layer:Datadog-Extension:68"
      ),
      lambda.LayerVersion.fromLayerVersionArn(
        this,
        "layer",
        "arn:aws:lambda:ca-central-1:464622532012:layer:Datadog-Python310:104"
      ),
    ];
    this.addLayers(...layers);
    const cfnFunction = this.node.defaultChild as lambda.CfnFunction;
    cfnFunction.handler = "datadog_lambda.handler.handler";
  }
}
