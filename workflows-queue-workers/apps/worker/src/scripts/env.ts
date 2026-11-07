/** Reads a variable from the lane environment `devlanes run` gives the task. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; run this script with devlanes run cleanup`);
  }
  return value;
}

/** What the task scripts read; the worker gets one more variable, parsed in src/env.ts. */
export const scriptEnv = {
  redisUrl: required("REDIS_URL"),
  queuePrefix: required("QUEUE_PREFIX"),
};
