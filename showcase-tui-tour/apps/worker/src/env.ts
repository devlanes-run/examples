/** Reads a variable devlanes sets, failing early with a hint when the worker runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

const redisUrl = required("REDIS_URL");
const smtpUrl = required("SMTP_URL");

/** Everything the worker reads from its environment, parsed once at startup. */
export const env = {
  lane: Number(required("DEVLANES_LANE")),
  // Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
  branch: required("LANE_LABEL"),
  domain: required("LANE_DOMAIN"),
  // global_env: the shared Redis with the lane's index as the path, and the lane's own Mailpit.
  redisUrl,
  redisIndex: Number(new URL(redisUrl).pathname.slice(1)),
  smtpUrl,
  smtpHost: new URL(smtpUrl).host,
};
