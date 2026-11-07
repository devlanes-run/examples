import { checkFor } from "../checks.js";
import { env } from "../env.js";
import type { LaneInfo } from "../lane.js";
import type { Mode } from "../mode.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

type ServicePageProps = {
  info: LaneInfo;
  mode: Mode;
  /** The Host header this request arrived with. */
  host: string;
};

/** A checked service's page: its ready check and the Host header the app received. */
export function ServicePage({ info, mode, host }: ServicePageProps) {
  const entry = checkFor(info.service);
  return (
    <Layout
      title={`${info.service}, lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="basics-ready-checks"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        Served by <code>{info.service}</code> from the worktree on <code>{info.branch}</code>.{" "}
        <a href={env.indexUrl}>All checks</a>.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Ready check</h2>
      <div class="dl-card">
        <dl class="dl-rows">
          <dt>check</dt>
          <dd>
            <span class="dl-ok">{entry?.check ?? "ready"}</span>
          </dd>
          <dt>why</dt>
          <dd>{entry?.about}</dd>
          <dt>app</dt>
          <dd>{mode.behaviour}</dd>
          <dt>Host</dt>
          <dd>{host}</dd>
          <dt>accepts</dt>
          <dd>{mode.allowedHost ?? "any Host"}</dd>
        </dl>
      </div>
    </Layout>
  );
}
