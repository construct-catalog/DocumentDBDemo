import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');
import codebuild = require('@aws-cdk/aws-codebuild');
import codecommit = require('@aws-cdk/aws-codecommit');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codepipeline_actions = require('@aws-cdk/aws-codepipeline-actions');
import cdk = require('@aws-cdk/core');

export interface SageMakerPipelineProps {
  /**
   * The visibility timeout to be configured on the SQS Queue, in seconds.
   *
   */
  readonly stagingBucket: s3.Bucket;

  /**
   * The Key used to trigger the Pipeline, this should be the name of your ML Model
   *
   */
  readonly fileModelName: string;

  /**
   * Name to use for the new Repository
   *
   */
  readonly repositoryName: string;
}

export class SageMakerPipeline extends cdk.Construct {
  public readonly artifactBucket: s3.IBucket;
  constructor(scope: cdk.Construct, id: string, props: SageMakerPipelineProps) {
    super(scope, id);

    const sourceRepository = new codecommit.Repository(this, "SourceRepo", {
      repositoryName: props.repositoryName
    });

    const LambdaBuilderMXNet = new codebuild.PipelineProject(this, 'CdkBuild', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: 'npm install',
          },
          build: {
            commands: [
              `"aws s3 cp s3://${props.stagingBucket}/${props.fileModelName} ."`,
              `"tar zxf ${props.fileModelName}"`
            ],
          },
        },
        artifacts: {
          type: 'zip',
          'base-directory': 'dist',
          files: [
            'LambdaStack.template.json',
          ],
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_8_11_0,
      },
    });

    const s3SourceOutput = new codepipeline.Artifact();
    const codeCommitOutput = new codepipeline.Artifact();
    const lambdaBuildOutput = new codepipeline.Artifact('LambdaBuilderMXNetBuildOutput');

    const inferencePipeline = new codepipeline.Pipeline(this, 'Pipeline');

    // Source Stage
    inferencePipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: 'S3_Source',
          bucket: props.stagingBucket,
          bucketKey: props.fileModelName,
          output: s3SourceOutput,
        }),
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: sourceRepository,
          output: codeCommitOutput,
        }),
      ],
    });

    // Build Stage
    inferencePipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Lambda_Build',
          project: LambdaBuilderMXNet,
          input: codeCommitOutput,
          extraInputs: [s3SourceOutput],
          outputs: [lambdaBuildOutput],
        }),
      ],
    });

    // Deploy Stage
    // inferencePipeline.addStage({
    //   stageName: 'Deploy',
    //   actions: [
    //     new codepipeline_actions.CloudFormationCreateUpdateStackAction({
    //       actionName: 'Lambda_CFN_Deploy',
    //       templatePath: cdkBuildOutput.atPath('LambdaStack.template.json'),
    //       stackName: 'LambdaDeploymentStack',
    //       adminPermissions: true,
    //       parameterOverrides: {
    //         ...props.lambdaCode.assign(lambdaBuildOutput.s3Location),
    //       },
    //       extraInputs: [lambdaBuildOutput],
    //     }),
    //   ],
    // });
    this.artifactBucket = inferencePipeline.artifactBucket
  }
}
