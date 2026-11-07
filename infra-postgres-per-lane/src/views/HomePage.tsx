import type { LaneInfo } from "../lane.js";
import type { State } from "../state.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";
import { PostgresCard } from "./PostgresCard.js";
import { RedisCard } from "./RedisCard.js";

type HomePageProps = {
  info: LaneInfo;
  state: State;
};

/** The lane card, the lane's Postgres, its Redis database and the routes. */
export function HomePage({ info, state }: HomePageProps) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="infra-postgres-per-lane"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>, with a Postgres of its own and a database index in the shared
        Redis.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Postgres, one per lane</h2>
      <p class="dl-lede">
        This lane's own container, on a host port from the lane's block.{" "}
        <code>devlanes lane clean</code> removes it with its volume.
      </p>
      <PostgresCard postgres={state.postgres} />

      <h2 class="dl-h2">Redis, shared</h2>
      <p class="dl-lede">
        One Redis for every lane. This lane counts its visits in database {state.redis.db}, so other
        lanes keep their own count.
      </p>
      <RedisCard redis={state.redis} />

      <h2 class="dl-h2">Routes</h2>
      <div class="dl-card">
        <dl class="dl-rows">
          <dt>GET /api/state</dt>
          <dd>
            <a href="/api/state">Postgres and Redis as JSON</a>
          </dd>
          <dt>GET /lane</dt>
          <dd>
            <a href="/lane">the lane values as JSON</a>
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
