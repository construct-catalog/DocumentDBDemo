import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
import lambda = require('@aws-cdk/aws-lambda');
import path = require('path');
import cdk = require('@aws-cdk/core');

export interface LambdaCopyProps {
  /**
   * The bucket where SageMaker puts trained Models
   *
   */
  readonly inputBucket: s3.Bucket;

  /**
   * The Bucket that acts as the source for the CodePipeline
   *
   */
  readonly outputBucket: s3.Bucket;

  /**
   * Name of the model file
   *
   */
  readonly fileModelName: string;
}

export class LambdaCopy extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: LambdaCopyProps) {
    super(scope, id);

    const modelCopyLambda = new lambda.Function(this, "ModelCopyLambda", {
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'lambda')),
      handler: "app.lambda_handler",
      runtime: lambda.Runtime.PYTHON_3_7,
      environment: {
        FILE_MODEL_NAME: "model.zip",
        SOURCE_BUCKET: props.inputBucket.bucketName,
        DESTINATION_BUCKET: props.outputBucket.bucketName
      }
    });

    modelCopyLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:*'],
      effect: iam.Effect.ALLOW,
      resources: [
        props.inputBucket.bucketArn,
        `${props.inputBucket.bucketArn}/*`,
      ]
    }));

    modelCopyLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:*'],
      effect: iam.Effect.ALLOW,
      resources: [
        props.outputBucket.bucketArn,
        `${props.outputBucket.bucketArn}/*`,
      ]
    }));

    modelCopyLambda.addEventSource(new S3EventSource(props.inputBucket, {
      events: [s3.EventType.OBJECT_CREATED],
    }));
  }
}
