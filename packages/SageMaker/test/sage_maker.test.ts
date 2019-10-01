// import { expect as expectCDK, haveResource, SynthUtils } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import SageMaker = require('../lib/index');
import s3 = require('@aws-cdk/aws-s3');

test('SQS Queue Created', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "TestStack");
    // WHEN

    new SageMaker.SageMaker(stack, 'MyTestConstruct', {
      sagemakerOutputBucket: new s3.Bucket(stack, "testBucket"),
      fileModelName: "file.zip",
      projectName: "testProject"
    });
    // THEN
    
    console.log(app.synth());
    // expectCDK(stack).to(haveResource("AWS::SQS::Queue"));
});