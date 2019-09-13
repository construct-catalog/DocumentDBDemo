#!/usr/bin/env node 
// 
// 
import cdk = require('@aws-cdk/cdk'); 
import delivlib = require('aws-delivlib');
 
export class PipelineStack extends cdk.Stack { 
  constructor(parent : cdk.App, id : string, props : cdk.StackProps = { }) { 
    super(parent, id, props); 
 
    const pipeline = new delivlib.Pipeline(this, 'CodeCommitPipeline', { 
      title: 'CDK Constructs', 
      repo: new delivlib.GitHubRepo({
        tokenParameterName: 'DocumentDbDemoGithub',
        repository: 'CDK-User-Group/DocumentDBDemo'
      }),
      pipelineName: 'DocumentDBDemo',
      notificationEmail: 'aws-pipeline-notification@rboyd.dev' 
    }); 
 
    pipeline.publishToNpm({ 
      npmTokenSecret: {secretArn: 'arn:aws:secretsmanager:us-east-1:272361391940:secret:npm-Kl9HUt'}, 
    }); 
 
    pipeline.publishToPyPI({ 
      loginSecret: {secretArn: 'arn:aws:secretsmanager:us-east-1:272361391940:secret:pypi-fXLfIO'}, 
    });

    const mavenSigningKey = new delivlib.OpenPGPKeyPair(this, 'MavenCodeSign', {
      email: 'mavenkey@rboyd.dev',
      identity: 'CDK Construct Repo',
      secretName: 'maven-code-sign',
      pubKeyParameterName: 'mavenPublicKey',
      keySizeBits: 4096,
      expiry: '1y',
      version: 2.0
    });

    pipeline.publishToMaven({
      mavenLoginSecret: { secretArn: 'arn:aws:secretsmanager:us-east-1:272361391940:secret:sonatype/rhboyd-lu8KQl' },
      signingKey: mavenSigningKey,
      stagingProfileId: 'dc69a1bde808a2'
    });
  }
} 
 
const app = new cdk.App(); 
 
// this pipeline is mastered in a specific account where all the secrets are stored 
new PipelineStack(app, 'rhboyd-cdkconstructs-documentdb', {
  env: { region: 'us-east-1', account: '272361391940' }, 
}); 
 
app.run(); 