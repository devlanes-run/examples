import type { QueueState } from "@queue-workers/queue";
import { Card } from "./Card.js";
import { FinishedTable } from "./FinishedTable.js";
import { WorkerRows } from "./WorkerRows.js";

/** The part of the page the browser redraws every second from `GET /jobs/live`. */
export function JobsLive({ state }: { state: QueueState }) {
  const busy = Object.values(state.workers).filter((w) => w.state === "busy").length;
  return (
    <>
      <Card title={`queue_prefix: ${state.prefix}`}>
        <dl class="dl-rows">
          <dt>waiting</dt>
          <dd>{state.waiting}</dd>
          <dt>in flight</dt>
          <dd>{busy}</dd>
          <dt>finished</dt>
          <dd class="dl-ok">{state.finished.length} shown, newest first</dd>
        </dl>
      </Card>

      <h2 class="dl-h2">Workers</h2>
      <p class="dl-lede">
        <code>replicas: 2</code> runs <code>worker.1</code> and <code>worker.2</code>, each with{" "}
        <code>WORKER_ID</code> from <code>{"${{ replica.index }}"}</code>.{" "}
        <code>devlanes stop +worker</code> lets each one finish its job first.
      </p>
      <Card title="keep_awake: true">
        <WorkerRows state={state} />
      </Card>

      <h2 class="dl-h2">Finished jobs</h2>
      <Card title={`${state.prefix}:done`}>
        <FinishedTable jobs={state.finished} />
      </Card>
    </>
  );
}
