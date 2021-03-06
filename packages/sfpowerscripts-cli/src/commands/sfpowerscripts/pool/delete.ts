import { core, flags, SfdxCommand } from "@salesforce/command";
import { AnyJson } from "@salesforce/ts-types";
import PoolDeleteImpl from "../../../impl/pool/PoolDeleteImpl";

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = core.Messages.loadMessages(
  "@dxatscale/sfpowerscripts",
  "scratchorg_pooldelete"
);

export default class Delete extends SfdxCommand {
  public static description = messages.getMessage("commandDescription");

  protected static requiresDevhubUsername = true;

  public static examples = [
    `$ sfdx sfpowerscripts:pool:delete -t core `,
    `$ sfdx sfpowerscripts:pool:delete -t core -v devhub`
  ];

  protected static flagsConfig = {
    tag: flags.string({
      char: "t",
      description: messages.getMessage("tagDescription"),
      required: true,
    }),
    mypool: flags.boolean({
      char: "m",
      description: messages.getMessage("mypoolDescription"),
      required: false,
    }),
    allscratchorgs: flags.boolean({
      char: "a",
      description: messages.getMessage("allscratchorgsDescription"),
      required: false,
    }),
    inprogressonly: flags.boolean({
      char: "i",
      description: messages.getMessage("inprogressonlyDescription"),
      required: false,
      exclusive: ["allscratchorgs"],
    }),
  };

  public async run(): Promise<AnyJson> {
   
    await this.hubOrg.refreshAuth();
    const hubConn = this.hubOrg.getConnection();

    this.flags.apiversion =
      this.flags.apiversion || (await hubConn.retrieveMaxApiVersion());

    let hydrateImpl = new PoolDeleteImpl(
      this.hubOrg,
      this.flags.apiversion,
      this.flags.tag,
      this.flags.mypool,
      this.flags.allscratchorgs,
      this.flags.inprogressonly
    );

    let result = await hydrateImpl.execute();

    if (!this.flags.json) {
      if (result.length > 0) {
        this.ux.log(`======== Scratch org Deleted ========`);
        this.ux.table(result, ["orgId", "username"]);
      } else {
        console.log(
          `${this.flags.tag} pool has No Scratch orgs available to delete.`
        );
      }
    }

    return result as AnyJson;
  }
}
