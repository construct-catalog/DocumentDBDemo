import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import lambda = require('@aws-cdk/aws-lambda');
import path = require('path');
import DocDB = require('./docdb');
import DocDBApi = require('./docApi');

export interface DocDbLibProps {
  /**
   * The visibility timeout to be configured on the SQS Queue, in seconds.
   *
   * @default Duration.seconds(300)
   */
  readonly vpc?: ec2.Vpc;
}

export class DocDbLib extends cdk.Construct {
  /** @returns the ARN of the SQS queue */
  public readonly queueArn: string;

  constructor(scope: cdk.Construct, id: string, props: DocDbLibProps = {}) {
    super(scope, id);

    const docdb = new DocDB.DocDb(this, "MyDocDbConstruct", {vpc: props.vpc});

    const lambda_function = new lambda.Function(
      this,
      "MyCrudFunction",
      {
        timeout: cdk.Duration.seconds(30),
        handler: "app.lambda_handler",
        runtime: lambda.Runtime.PYTHON_3_7,
        code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
        // code: new lambda.AssetCode('./lib/lambda'),
        vpc: docdb.vpc,
        securityGroup: docdb.securityGroup,
        vpcSubnets: {subnetType: ec2.SubnetType.PRIVATE},
        environment: {
          "USER_NAME": docdb.userName,
          "PASSWORD": docdb.password,
          "ENDPOINT": docdb.endpoint,
          "PORT": docdb.port.toString()
        }
      }
    );

    new DocDBApi.DocDbApi(this, "MyDocDbApi", {lambda: lambda_function})
  }
}