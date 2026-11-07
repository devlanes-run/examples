import type { LaneInfo } from "@mprocs-migration/shared";
import type { MessagesResult } from "../messages.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";
import { MessagesCard } from "./MessagesCard.js";
import { MigrationCard } from "./MigrationCard.js";

type HomePageProps = { info: LaneInfo; messages: MessagesResult };

/** The lane, the messages and the hostnames that replaced the Caddy ones. */
export function HomePage({ info, messages }: HomePageProps) {
  const queued = messages.ok ? messages.messages.filter((m) => m.status === "queued").length : 0;
  return (
    <Layout title={`Lane ${info.lane ?? "?"} of ${info.project ?? "acme"}`} lane={info.lane}>
      <h1 class="dl-title">
        {info.lane === null
          ? "Running outside devlanes."
          : `This is lane ${info.lane} of ${info.project}.`}
      </h1>
      <p class="dl-lede">
        The <code>{info.service ?? "web"}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Messages</h2>
      <p class="dl-lede">
        The api keeps them, the worker sends the queued ones through the SMS stub.
        {queued > 0 && (
          <>
            {" "}
            {queued} queued: start the stub with <code>devlanes start sms-stub</code>.
          </>
        )}
      </p>
      <MessagesCard result={messages} />

      <h2 class="dl-h2">Before and after</h2>
      <p class="dl-lede">
        Under mprocs, Caddy routed fixed names to fixed ports and <code>scripts/slot.sh</code> moved
        them for other worktrees. Here each lane gets its own.
      </p>
      <MigrationCard info={info} />
    </Layout>
  );
}
