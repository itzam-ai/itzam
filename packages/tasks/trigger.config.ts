import { syncVercelEnvVars } from "@trigger.dev/build/extensions/core";
import { pythonExtension } from "@trigger.dev/python/extension";
import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  // Your project ref (you can see it on the Project settings page in the dashboard)
  project: "proj_rpbhwfeagopyxxjuxhvu",
  //The paths for your trigger folders
  dirs: ["./src/trigger"],
  maxDuration: 300,
  // Machine configuration for better performance with embedding tasks
  retries: {
    //If you want to retry a task in dev mode (when using the CLI)
    enabledInDev: false,
    //the default retry settings. Used if you don't specify on a task.
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  // Environment-specific build configuration
  build: {
    extensions: [
      pythonExtension({
        scripts: ["./src/python/**/*.py"],
        requirementsFile: "./src/python/requirements.txt",
      }),
      syncVercelEnvVars({
        projectId: "prj_KSiT1md6dVUfD2lwIl4ndxL0rIxX",
        vercelTeamId: "team_NyW385GwLLFmTa1xMVPYAmNg",
      }),
    ],
  },
});
