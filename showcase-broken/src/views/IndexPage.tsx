import type { Failure } from "../failures.js";
import type { LaneInfo } from "../lane.js";
import { FailureList } from "./FailureList.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

type IndexPageProps = {
  info: LaneInfo;
  failures: Failure[];
};

/** The index service's page: the lane card and every failure the lane can show. */
export function IndexPage({ info, failures }: IndexPageProps) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="showcase-broken"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>. Every other service in this lane is built to fail; start one by
        name to see its failure in the CLI, the TUI and the proxy's error page.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Broken on purpose</h2>
      <FailureList failures={failures} />
    </Layout>
  );
}
