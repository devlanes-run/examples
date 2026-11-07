import { env } from "../env.js";
import type { LaneInfo } from "../lane.js";
import { InvoicesCard } from "./InvoicesCard.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";
import { MonorepoCard } from "./MonorepoCard.js";

/** The billing page: the lane, the invoices and the link to the other project. */
export function HomePage({ info }: { info: LaneInfo }) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="workflows-pnpm-monorepo"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>. A separate devlanes project, declared in{" "}
        <code>apps/billing/devlanes.yaml</code>, with its own lanes and hostnames.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Invoices</h2>
      <InvoicesCard />

      <h2 class="dl-h2">The main app</h2>
      <MonorepoCard url={env.monorepoWebUrl} />
    </Layout>
  );
}
