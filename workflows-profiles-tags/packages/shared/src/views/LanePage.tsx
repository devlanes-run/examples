import type { Child } from "hono/jsx";
import type { LaneInfo } from "../lane.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

const EXAMPLE = "workflows-profiles-tags";

/** A page of one of the example's services: the lane heading and card, then the page's own cards. */
export function LanePage({ info, children }: { info: LaneInfo; children: Child }) {
  return (
    <Layout
      title={`${info.service}, lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example={EXAMPLE}
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>.
      </p>
      <LaneCard info={info} />
      {children}
    </Layout>
  );
}
