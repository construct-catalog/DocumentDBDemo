import ec2 = require('@aws-cdk/aws-ec2');
import docdb = require('@aws-cdk/aws-docdb');
// import secretsManager = require('@aws-cdk/aws-secretsmanager');
import cdk = require('@aws-cdk/core');


export interface DocDbProps {
  /**
   * 
   *
   * @default Region's default VPC
   */
  vpc?: ec2.Vpc;
}

export class DocDb extends cdk.Construct {
  /** @returns the VPC that the DocumentDB belongs to */
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.ISecurityGroup;
  public readonly userName: string;
  public readonly password: string;
  public readonly port: number;
  public readonly endpoint: string;

  constructor(scope: cdk.Construct, id: string, props: DocDbProps = {}) {
    super(scope, id);

    this.vpc = props.vpc || new ec2.Vpc(this, "DocumentDbVpc");

    this.securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this, "DefaultVpcDefaultSg",
      this.vpc.vpcDefaultSecurityGroup);
    this.securityGroup.connections.allowFrom(this.securityGroup, new ec2.Port({protocol:ec2.Protocol.ALL, stringRepresentation: "*"}));
    

    const subnet_group = new docdb.CfnDBSubnetGroup(
      this,
      "DocDbSubnetGroup",
      {
        dbSubnetGroupDescription: "Why is this mandatory?",
        dbSubnetGroupName: "MYSubnetGroup",
        subnetIds: this.vpc.privateSubnets.map(({ subnetId }) => (subnetId))
      }
    );

    // const templatedSecret = new secretsManager.Secret(this, 'TemplatedSecret', {
    //   generateSecretString: {
    //     secretStringTemplate: JSON.stringify({ username: 'user' }),
    //     generateStringKey: 'password'
    //   }
    // });

    this.userName = "RICHARDBOYD"
    this.password = "PASSWORD123456"
    const cluster = new docdb.CfnDBCluster(
      this,
      "DocDbCluster",
      {
        masterUsername: this.userName,
        masterUserPassword: this.password,
        vpcSecurityGroupIds: [this.vpc.vpcDefaultSecurityGroup],
        dbSubnetGroupName: subnet_group.ref
      }
    )
    this.port = cluster.port || 27017;
    this.endpoint = cluster.attrEndpoint;
    let instanceCount: number = 0;

    this.vpc.privateSubnets.map(({ availabilityZone }) => (new docdb.CfnDBInstance(
      this, 
      `DocDbInstance${instanceCount++}`,
      {
        dbClusterIdentifier: cluster.ref,
        dbInstanceClass: "db.r4.large",
        availabilityZone: availabilityZone
      }
    )));

    

  }
}
