/** Reads a variable devlanes sets, failing early with a hint when the process runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this process with devlanes`);
  }
  return value;
}

/** Wraps a parser so it reads the environment on the first call only. */
function once<T>(parse: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= parse());
}

/** What the web service reads. */
export const serverEnv = once(() => ({
  port: Number(required("PORT")),
  host: process.env.HOST ?? "127.0.0.1",
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
  branch: required("LANE_LABEL"),
  domain: required("LANE_DOMAIN"),
  // The lane's own hostname, where the provider sends the browser back after login.
  publicUrl: required("PUBLIC_URL"),
  oidcIssuer: required("OIDC_ISSUER"),
  oidcPort: Number(required("OIDC_PORT")),
  whoamiUrl: required("WHOAMI_URL"),
}));

/** What the docs server reads when started with `devlanes exec`. */
export const docsEnv = once(() => ({
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  // Exec units do not get global_env in devlanes 0.11.3, so LANE_LABEL may be missing.
  branch: process.env.LANE_LABEL ?? null,
}));
