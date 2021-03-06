import PackageMetadata from "../../PackageMetadata";
import SourcePackageGenerator from "../../generators/SourcePackageGenerator";
import ProjectConfig from "../../project/ProjectConfig";
import SFPLogger from "../../utils/SFPLogger";
import * as fs from "fs-extra";
import { EOL } from "os";
import SFPStatsSender from "../../utils/SFPStatsSender";

export default class CreateDataPackageImpl {
  private packageLogger;

  public constructor(
    private projectDirectory: string,
    private sfdx_package: string,
    private packageArtifactMetadata: PackageMetadata
  ) {
    fs.outputFileSync(
      `.sfpowerscripts/logs/${sfdx_package}`,
      `sfpowerscripts--log${EOL}`
    );
    this.packageLogger = `.sfpowerscripts/logs/${sfdx_package}`;
  }

  public async exec(): Promise<PackageMetadata> {
    this.packageArtifactMetadata.package_type = "data";

    SFPLogger.log(
      "--------------Create Data Package---------------------------",
      null,
      this.packageLogger
    );
    SFPLogger.log(
      "Project Directory",
      this.projectDirectory,
      this.packageLogger
    );
    SFPLogger.log("sfdx_package", this.sfdx_package, this.packageLogger);
    SFPLogger.log(
      "packageArtifactMetadata",
      this.packageArtifactMetadata,
      this.packageLogger
    );

    let startTime = Date.now();

    //Get Package Descriptor
    let packageDescriptor = ProjectConfig.getSFDXPackageDescriptor(
      this.projectDirectory,
      this.sfdx_package
    );

    let packageDirectory: string = packageDescriptor["path"];

    this.writeDeploymentStepsToArtifact(packageDescriptor);

    //Get Artifact Detailes
    let sourcePackageArtifactDir = SourcePackageGenerator.generateSourcePackageArtifact(
      this.projectDirectory,
      this.sfdx_package,
      packageDirectory
    );

    this.packageArtifactMetadata.sourceDir = sourcePackageArtifactDir;

    //Add Timestamps
    let endTime = Date.now();
    let elapsedTime = endTime - startTime;
    this.packageArtifactMetadata.creation_details = {
      creation_time: elapsedTime,
      timestamp: Date.now(),
    };

    SFPStatsSender.logElapsedTime(
      "package.elapsed.time",
      this.packageArtifactMetadata.creation_details.creation_time,
      {
        package: this.packageArtifactMetadata.package_name,
        type: this.packageArtifactMetadata.package_type,
        is_dependency_validated: "false"
      }
    );
    SFPStatsSender.logCount("package.created", {
      package: this.packageArtifactMetadata.package_name,
      type: this.packageArtifactMetadata.package_type,
      is_dependency_validated: "false"
    });

    return this.packageArtifactMetadata;
  }

  private writeDeploymentStepsToArtifact(packageDescriptor: any) {

    if (packageDescriptor.assignPermSetsPreDeployment) {
      if (packageDescriptor.assignPermSetsPreDeployment instanceof Array)
        this.packageArtifactMetadata.assignPermSetsPreDeployment = packageDescriptor
          .assignPermSetsPreDeployment;

      else
        throw new Error("Property 'assignPermSetsPreDeployment' must be of type array");
    }


    if (packageDescriptor.assignPermSetsPostDeployment) {
      if (packageDescriptor.assignPermSetsPostDeployment instanceof Array)
        this.packageArtifactMetadata.assignPermSetsPostDeployment = packageDescriptor
          .assignPermSetsPostDeployment;

      else
        throw new Error("Property 'assignPermSetsPostDeployment' must be of type array");
    }
  }
}
