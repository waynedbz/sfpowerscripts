import { ReleaseChangelog, Release } from "./interfaces/ReleaseChangelogInterfaces"

export default function generateMarkdown(releaseChangelog: ReleaseChangelog, workItemURL: string, limit: number, showAllArtifacts: boolean): string {
  let payload: string = "";

  let limitReleases: number;
  if (limit <= releaseChangelog["releases"].length)
     limitReleases = releaseChangelog["releases"].length - limit;
  else
     limitReleases = 0;

  // Start from latest Release
  for (let releaseNum = releaseChangelog["releases"].length - 1 ; releaseNum >= limitReleases ; releaseNum-- ) {
      let release: Release = releaseChangelog["releases"][releaseNum];

      payload += `\n# ${release["name"]}\n`;

      payload += "### Artifacts\n";
      for (let artifactNum = 0 ; artifactNum < release["artifacts"].length ; artifactNum++) {
          if (release["artifacts"][artifactNum]["from"] !== release["artifacts"][artifactNum]["to"] || showAllArtifacts)
            payload += `**${release["artifacts"][artifactNum]["name"]}**     v${release["artifacts"][artifactNum]["version"]} (${release["artifacts"][artifactNum]["to"]})\n\n`;
      }

      payload += "### Work Items\n";
      if (Object.keys(release["workItems"]).length > 0) {
        for (let workItem in release["workItems"]) {
            let specificWorkItemURL: string;
            if (workItemURL != null) {
                if (workItemURL.endsWith('/')) {
                    specificWorkItemURL = workItemURL.concat(workItem);
                }
                else {
                    specificWorkItemURL = workItemURL.concat(`/${workItem}`);
                }
            }
            payload += `  - [${workItem}](${specificWorkItemURL})\n`
        }
      } else {
          payload += `N/A\n`;
      }

      let versionChangeOnly: string[] = [];
      let noChangeInVersion: string[] = [];
      let isCommitsSectionEmpty: boolean = true;
      payload += "\n### Commits\n";
      for (let artifact of release["artifacts"]) {
          if (artifact["from"] !== artifact["to"]) {
              if (artifact["commits"].length > 0) {
                  isCommitsSectionEmpty = false;
                  payload += `\n#### ${artifact["name"]}\n`;
                  for (let commit of artifact["commits"]) {
                      let commitDate: Date = new Date(commit.date);
                      payload += `  - ${getDate(commitDate)}, ${getTime(commitDate)}      ${commit.commitId}      ${commit.message}\n`;
                  }
              } else {
                  versionChangeOnly.push(artifact["name"]);
              }
          }  else if (artifact["from"] === artifact["to"]) {
              noChangeInVersion.push(artifact["name"]);
          }
      }

      if (isCommitsSectionEmpty) {
          payload += `N/A\n`;
      }

      if (versionChangeOnly.length > 0) {
        payload += "\n### Additional Information\n";
        payload += `The following artifacts' version may have changed due to an update in the scratch org definition file, `;
        payload += `incremented package version in SFDX project configuration, or build all packages:\n`

        versionChangeOnly.forEach( (artifactName) => payload += `  - ${artifactName}\n`);
      }

      if (noChangeInVersion.length > 0 && showAllArtifacts) {
        payload += "\nArtifacts with no changes:\n";
        noChangeInVersion.forEach( (artifactName) => payload += `  - ${artifactName}\n`);
      }
  }
  return payload;
}


function getDate(date: Date): string {
 let day: number = date.getDate();
 let month: number = date.getMonth();
 let year: number = date.getFullYear();
 let pad = (n) => n<10 ? '0'+n : n;

 return pad(day) + "/" + pad(month+1) + "/" + year;
}

function getTime(date: Date): string {
 let hours: number = date.getHours();
 let minutes: number = date.getMinutes();
 let seconds: number = date.getSeconds();
 let pad = (n) => n<10 ? '0'+n : n;

 return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}
