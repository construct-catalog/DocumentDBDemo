// import { expect as expectCDK, haveResource, SynthUtils } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import DocDbLib = require('../lib/index');

test('SQS Queue Created', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "TestStack", {env: {region: "us-east-1"}});
    // WHEN
    new DocDbLib.DocDbLib(stack, 'MyTestConstruct');
    // THEN
    app.synth();
    console.log(app.synth());

});