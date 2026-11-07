/** Reads a variable devlanes sets, failing early with a hint when Vite runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/**
 * Where `vite build` writes and `vite preview` reads. devlanes.yaml points it into the lane's data
 * folder; `./build.sh` runs outside devlanes and gets `dist`.
 */
export const outDir = process.env.WEB_OUT_DIR ?? "dist";

/** The values the dev and preview servers report. */
export type ServerEnv = ReturnType<typeof serverEnv>;

/** Everything the dev and preview servers read, parsed when one of them starts. */
export function serverEnv() {
  return {
    port: Number(required("PORT")),
    project: required("DEVLANES_LANE_PROJECT"),
    lane: Number(required("DEVLANES_LANE")),
    laneName: required("DEVLANES_LANE_NAME"),
    service: required("DEVLANES_SERVICE"),
    // Set in devlanes.yaml from ${{ lane.label }}.
    branch: required("LANE_LABEL"),
    // npm sets this to the script it runs, so it shows whether a profile swapped dev for start.
    script: process.env.npm_lifecycle_event ?? null,
    // NODE_ENV and APP_PROFILE come from the profile, PROJECT_FILE from global_env.
    nodeEnv: process.env.NODE_ENV ?? null,
    profile: process.env.APP_PROFILE ?? null,
    projectFile: required("PROJECT_FILE"),
    // ${{ services.api.public_url }}: the page calls it from the browser.
    apiUrl: required("API_PUBLIC_URL"),
  };
}
