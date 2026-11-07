/** A job waiting on the queue. `ms` is how long the worker spends on it. */
export type Job = {
  id: number;
  ms: number;
  enqueued_at: number;
};

/** A job a worker took off the queue, with the raw list entry it removes once done. */
export type Claim = {
  job: Job;
  raw: string;
};

/** A job a worker finished, kept in the `done` list. */
export type FinishedJob = Job & {
  worker: string;
  pid: number;
  took_ms: number;
  finished_at: number;
};

/** What a worker is doing, as it last reported. */
export type WorkerState = "idle" | "busy" | "stopped";

/** A worker's last report, keyed by its unit name in the `workers` hash. */
export type WorkerStatus = {
  state: WorkerState;
  job: number | null;
  pid: number;
  at: number;
};

/** The queue as the api shows it: waiting count, workers and the newest finished jobs. */
export type QueueState = {
  prefix: string;
  waiting: number;
  workers: Record<string, WorkerStatus>;
  finished: FinishedJob[];
};
