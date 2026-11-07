/** Reads a variable devlanes sets, failing early with a hint when the server runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this service with devlanes start`);
  }
  return value;
}

/** Everything this service reads from its environment, parsed once at startup. */
export const env = {
  port: Number(required("PORT")),
  host: process.env.HOST ?? "127.0.0.1",
  project: required("DEVLANES_LANE_PROJECT"),
  lane: Number(required("DEVLANES_LANE")),
  laneName: required("DEVLANES_LANE_NAME"),
  service: required("DEVLANES_SERVICE"),
  // Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
  branch: required("LANE_LABEL"),
  domain: required("LANE_DOMAIN"),
  // Every https origin of the lane, for the CSRF check on the store forms.
  origins: required("DEVLANES_ORIGINS").split(","),
  // One URL per store from global_env, each ending in this lane's namespace.
  databaseUrl: required("DATABASE_URL"),
  redisUrl: required("REDIS_URL"),
  clickhouseUrl: required("CLICKHOUSE_URL"),
  amqpUrl: required("AMQP_URL"),
  s3Url: required("S3_URL"),
  smtpUrl: required("SMTP_URL"),
  mailpitUrl: required("MAILPIT_URL"),
};
