import type { QueueState, WorkerStatus } from "@queue-workers/queue";

function Status({ worker }: { worker: WorkerStatus }) {
  if (worker.state === "busy") return <span class="dl-url">busy with job {worker.job}</span>;
  if (worker.state === "stopped") return <span class="dl-bad">stopped</span>;
  return <span class="dl-ok">idle</span>;
}

/** One row per worker that reported to this lane's queue, with its state and finished jobs. */
export function WorkerRows({ state }: { state: QueueState }) {
  const workers = Object.entries(state.workers);
  if (workers.length === 0) {
    return (
      <dl class="dl-rows">
        <dt>none yet</dt>
        <dd>no worker has connected to this queue</dd>
      </dl>
    );
  }
  const counts = new Map<string, number>();
  for (const job of state.finished) counts.set(job.worker, (counts.get(job.worker) ?? 0) + 1);
  return (
    <dl class="dl-rows">
      {workers.map(([name, worker]) => (
        <>
          <dt>{name}</dt>
          <dd>
            <Status worker={worker} /> <span class="dl-key">pid {worker.pid}</span>,{" "}
            {counts.get(name) ?? 0} jobs below
          </dd>
        </>
      ))}
    </dl>
  );
}
