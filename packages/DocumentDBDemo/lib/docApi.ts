import apigw = require('@aws-cdk/aws-apigateway');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/core');

export interface DocDbApiProps {
  /**
   * Function to use for the Back-end of the API Gateway
   */
  lambda: lambda.Function;
}

export class DocDbApi extends cdk.Construct {
  /** @returns the VPC that the DocumentDB belongs to */
  public readonly vpc: string;

  constructor(scope: cdk.Construct, id: string, props: DocDbApiProps) {
    super(scope, id);
    const restApi = new apigw.LambdaRestApi(this, "MyDocDBApi", {
      handler: props.lambda,
      proxy: false,
      deploy: true
    });

    const docs = restApi.root.addResource('document');
    docs.addMethod('GET');
    docs.addMethod('POST');
  }
}
