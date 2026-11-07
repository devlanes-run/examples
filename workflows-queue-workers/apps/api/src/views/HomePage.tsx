import type { QueueState } from "@queue-workers/queue";
import type { LaneInfo } from "../lane.js";
import { MAX_ENQUEUE } from "../queue.js";
import { Card } from "./Card.js";
import { JobsLive } from "./JobsLive.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

/** The api's page: the lane, the enqueue form and this lane's queue, workers and finished jobs. */
export function HomePage({ info, state }: { info: LaneInfo; state: QueueState }) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="workflows-queue-workers"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>. It puts jobs on this lane's queue, and the two{" "}
        <code>worker</code> replicas take them.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">This lane's queue</h2>
      <p class="dl-lede">
        Every key starts with <code>{state.prefix}</code>, from <code>queue_prefix</code> in{" "}
        <code>lanes.vars</code>, so workers of other lanes never take these jobs from the shared
        Redis. Each job takes 2 seconds.
      </p>
      <form class="enqueue" method="post" action="/jobs">
        <input
          type="number"
          name="count"
          min="1"
          max={MAX_ENQUEUE}
          value="6"
          aria-label="number of jobs"
        />
        <button class="dl-button">Enqueue jobs</button>
      </form>
      <p class="dl-lede">
        The cards below refresh every second: <span id="live-state">loading</span>
      </p>
      <div id="jobs">
        <JobsLive state={state} />
      </div>

      <h2 class="dl-h2">Routes</h2>
      <Card title="api">
        <dl class="dl-rows">
          <dt>GET /api/jobs</dt>
          <dd>
            <a href="/api/jobs">the queue, workers and finished jobs as JSON</a>
          </dd>
          <dt>POST /api/jobs?count=N</dt>
          <dd>enqueue N jobs</dd>
          <dt>GET /lane</dt>
          <dd>
            <a href="/lane">the lane values as JSON</a>
          </dd>
          <dt>GET /healthz</dt>
          <dd>
            <a href="/healthz">the ready check</a>: <span class="dl-ok">ok</span>
          </dd>
        </dl>
      </Card>
    </Layout>
  );
}
