import { Card, LaneCard, Layout, type LaneInfo } from "@provider-stubs/shared";
import { env } from "../env.js";
import type { Inbox } from "../inbox.js";
import { MessageList } from "./MessageList.js";

/** The fake provider's page: the lane, the inbox and the API senders call. */
export function InboxPage({ info, inbox }: { info: LaneInfo; inbox: Inbox }) {
  const { name, fields } = inbox.provider;
  const messages = inbox.list();
  return (
    <Layout title={`${info.service}, lane ${info.lane} of ${info.project}`} lane={info.lane}>
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service, a fake {name} provider, answered from the worktree
        on <code>{info.branch}</code>. It keeps what it receives in memory, so the inbox is empty
        after a restart.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Inbox</h2>
      <Card title={`${messages.length} message${messages.length === 1 ? "" : "s"}`}>
        <MessageList messages={messages} fields={fields} appUrl={env.appUrl} />
      </Card>

      <h2 class="dl-h2">Provider API</h2>
      <Card title="POST /v1/messages">
        <dl class="dl-rows">
          <dt>auth</dt>
          <dd>
            <code>Authorization: Bearer {env.apiKey}</code>
          </dd>
          <dt>fields</dt>
          <dd>
            {fields.map((field, index) => (
              <>
                {index > 0 && ", "}
                <span class="dl-key">{field}</span>
              </>
            ))}
          </dd>
          <dt>list</dt>
          <dd>
            <a href="/v1/messages">GET /v1/messages</a>
          </dd>
          <dt>sender</dt>
          <dd>
            <a href={env.appUrl}>{env.appUrl}</a>
          </dd>
        </dl>
      </Card>
    </Layout>
  );
}
