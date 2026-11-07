import { checks } from "../checks.js";
import { env } from "../env.js";
import type { LaneInfo } from "../lane.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

/** The index service's page: the lane card and a link to every checked service. */
export function IndexPage({ info }: { info: LaneInfo }) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="basics-ready-checks"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        Served by <code>{info.service}</code> from the worktree on <code>{info.branch}</code>. Each
        service below waits for another kind of <code>ready</code> check before{" "}
        <code>devlanes start</code> counts it up.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Services</h2>
      <div class="dl-card">
        <dl class="dl-rows">
          {checks.map(({ service, check, about }) => (
            <>
              <dt>
                <a href={env.serviceUrls?.[service]}>{service}</a>
              </dt>
              <dd>
                <span class="dl-ok">{check}</span> {about}
              </dd>
            </>
          ))}
        </dl>
      </div>
    </Layout>
  );
}
