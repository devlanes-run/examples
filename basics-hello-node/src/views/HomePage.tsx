import { env } from "../env.js";
import type { LaneInfo } from "../lane.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

export function HomePage({ info }: { info: LaneInfo }) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="basics-hello-node"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">One server per lane</h2>
      <p class="dl-lede">
        devlanes gave this process <code>PORT={info.port}</code> from the lane's block and routes{" "}
        <code>{env.domain}</code> to it. Another worktree runs its own copy on its own port and
        hostname.
      </p>
      <div class="dl-card">
        <dl class="dl-rows">
          <dt>GET /lane</dt>
          <dd>
            <a href="/lane">the values above as JSON</a>
          </dd>
          <dt>GET /healthz</dt>
          <dd>
            <a href="/healthz">the ready check</a>: <span class="dl-ok">ok</span>
          </dd>
        </dl>
      </div>
    </Layout>
  );
}
