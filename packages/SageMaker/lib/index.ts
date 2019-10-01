import s3 = require('@aws-cdk/aws-s3');
import cdk = require('@aws-cdk/core');
import sagemakerPipeline = require('./pipeline');
import lambdaCopy = require('./model_copy_lambda');

export interface SageMakerProps {
  /**
   * The visibility timeout to be configured on the SQS Queue, in seconds.
   *
   */
  readonly sagemakerOutputBucket: s3.Bucket;

  /**
   * Name of the model file
   *
   */
  readonly fileModelName: string;

  /**
   * The name of this project
   *
   */
  readonly projectName: string;
}

export class SageMaker extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: SageMakerProps) {
    super(scope, id);

    const stagingBucket = new s3.Bucket(this, "StagingBucket", {
      // Versioning needs to be enabled to use an S3 bucket as the source for CodePipeline
      versioned: true
    });

    new lambdaCopy.LambdaCopy(this, "ModelCopy", {
      inputBucket: props.sagemakerOutputBucket,
      outputBucket: stagingBucket,
      fileModelName: props.fileModelName
    });

    new sagemakerPipeline.SageMakerPipeline(this, "SageMakerPipeline", {
      stagingBucket: stagingBucket,
      fileModelName: props.fileModelName,
      repositoryName: `${props.projectName}repo`
    });
  }
}
