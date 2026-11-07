import { env } from "./env.js";

/** How this process was started: by which script, from which code, under which profile. */
export type ModeInfo = {
  script: string | null;
  runs_from: "src" | "dist";
  node_env: string | null;
  profile: string | null;
  project_file: string;
  log_level: string;
};

// `tsx watch src/index.ts` loads this file as .ts; `node dist/index.js` loads what tsc built.
const runsFrom = import.meta.url.endsWith(".ts") ? "src" : "dist";

/** The run mode the page shows on the api card and `/mode` returns. */
export function modeInfo(): ModeInfo {
  return {
    script: env.script,
    runs_from: runsFrom,
    node_env: env.nodeEnv,
    profile: env.profile,
    project_file: env.projectFile,
    log_level: env.logLevel,
  };
}
