/** Reads a variable devlanes sets, failing early with a hint when the worker runs outside devlanes. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set; start this worker with devlanes start`);
  }
  return value;
}

/** Everything the worker reads from its environment, parsed once at startup. */
export const env = {
  // Set in devlanes.yaml: REDIS_URL from the shared container's port, QUEUE_PREFIX from lanes.vars.
  redisUrl: required("REDIS_URL"),
  queuePrefix: required("QUEUE_PREFIX"),
  // ${{ replica.index }}, 1 for worker.1 and 2 for worker.2.
  workerId: required("WORKER_ID"),
};
