import type { LaneInfo } from "../lane.js";
import { type Outcome, stores } from "../stores/index.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";
import { StoreCard } from "./StoreCard.js";

type DashboardProps = {
  info: LaneInfo;
  health: Record<string, Outcome<string>>;
  /** The store whose form was just posted, with its write-then-read output. */
  tried?: { key: string; result: Outcome<string[]> };
};

/** The lane card followed by one card per store. */
export function DashboardPage({ info, health, tried }: DashboardProps) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="infra-multi-database"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">One namespace per store</h2>
      <p class="dl-lede">
        The shared containers serve every lane; each card names the part that belongs to this one.
        Mailpit runs once per lane instead. <a href="/api/stores">/api/stores</a> returns the same
        values as JSON.
      </p>
      {stores.map((store) => (
        <StoreCard
          store={store}
          health={health[store.key]}
          result={tried?.key === store.key ? tried.result : undefined}
        />
      ))}
    </Layout>
  );
}
