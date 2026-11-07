import { env } from "../env.js";
import type { LaneInfo } from "../lane.js";
import { ApiCard } from "./ApiCard.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

/** The lane page: this service's lane values, how it was started and the API's answer. */
export function HomePage({ info }: { info: LaneInfo }) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="workflows-ci-with"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>. <code>npm test</code> checks this lane's <code>/lane</code> and
        the API's CORS answer for this page's origin.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Started by</h2>
      <p class="dl-lede">
        <code>devlanes start</code> runs the <code>dev</code> script. The <code>e2e</code> profile
        swaps it for <code>start</code> and sets <code>NODE_ENV=test</code>.
      </p>
      <div class="dl-card">
        <dl class="dl-rows">
          <dt>script</dt>
          <dd>npm run {env.script ?? "(unknown)"}</dd>
          <dt>NODE_ENV</dt>
          <dd>{env.nodeEnv ?? "(unset)"}</dd>
        </dl>
      </div>

      <h2 class="dl-h2">The API from the browser</h2>
      <p class="dl-lede">
        The page fetches the API's hostname from another origin, so the answer shows only when the
        API sends <code>Access-Control-Allow-Origin</code> for this page.
      </p>
      <ApiCard url={`${env.apiUrl}/`} />
    </Layout>
  );
}
