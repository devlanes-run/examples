import type { LaneInfo } from "../lane.js";
import { ChatCard } from "./ChatCard.js";
import { EventsCard } from "./EventsCard.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";
import { PortsCard } from "./PortsCard.js";

/** The lane page: lane values, the named ports, the SSE stream and the chat. */
export function HomePage({ info }: { info: LaneInfo }) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="web-realtime-ws"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>, with one process listening on three ports, each behind its own
        hostname.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Named ports</h2>
      <PortsCard />

      <h2 class="dl-h2">Server-Sent Events</h2>
      <EventsCard />

      <h2 class="dl-h2">WebSocket chat</h2>
      <ChatCard />
    </Layout>
  );
}
