/** Reads a variable devlanes sets, failing early with a hint when the process runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this lane with devlanes start`);
  }
  return value;
}

/** Wraps a parser so it reads the environment on the first call only. */
function once<T>(parse: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= parse());
}

/** The lane's database, which every process gets as DATABASE_URL from global_env. */
export const databaseEnv = once(() => {
  const url = required("DATABASE_URL");
  return { url, name: new URL(url).pathname.slice(1) };
});

/** What the api service reads. Services get PORT, DEVLANES_SERVICE and DEVLANES_ORIGINS; tasks do not. */
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
  // Every https origin of the lane, for the CSRF check on form posts.
  origins: required("DEVLANES_ORIGINS").split(","),
}));

/** What the seed task reads. API_URL comes from the task's env in devlanes.yaml. */
export const seedEnv = once(() => ({
  apiUrl: required("API_URL"),
  lane: Number(required("DEVLANES_LANE")),
}));
