/** The Redis key names of one lane's queue, all starting with `prefix`. */
export function queueKeys(prefix: string) {
  return {
    nextId: `${prefix}:next_id`,
    waiting: `${prefix}:waiting`,
    // One list per worker holds its claimed job, so a killed worker's job waits there for its
    // next start instead of being lost.
    active: (worker: string) => `${prefix}:active:${worker}`,
    done: `${prefix}:done`,
    workers: `${prefix}:workers`,
  };
}

/** The key names `queueKeys` returns. */
export type QueueKeys = ReturnType<typeof queueKeys>;
