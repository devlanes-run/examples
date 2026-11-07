import { env } from "../env.js";
import type { LaneInfo } from "../lane.js";
import { seconds, type Stats } from "../stats.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

/** The page of a `web` service: its lane values, its `/stats` and a link back to the index. */
export function ServicePage({ info, stats }: { info: LaneInfo; stats: Stats }) {
  return (
    <Layout
      title={`${info.service}, lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="showcase-many-services"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>.
      </p>
      <LaneCard info={info} />
      <div class="dl-card">
        <div class="dl-bar">
          <span class="dl-dots">
            <i />
            <i />
            <i />
          </span>
          <span>/stats</span>
          <span />
        </div>
        <dl class="dl-rows">
          <dt>kind</dt>
          <dd>
            <span class={`kind-${stats.kind}`}>{stats.kind}</span>
          </dd>
          <dt>ready after</dt>
          <dd>
            <span class="dl-ok">{seconds(stats.ready_after_ms ?? 0)} s</span>
          </dd>
          <dt>cpu bursts</dt>
          <dd>{stats.bursts}</dd>
          <dt>cpu time</dt>
          <dd>{stats.cpu_ms} ms</dd>
          <dt>uptime</dt>
          <dd>{stats.uptime_s} s</dd>
        </dl>
      </div>
      <p class="dl-lede">
        <a href={`https://${env.domain}`}>Every service of this lane</a>
      </p>
    </Layout>
  );
}
