import type { Message } from "@mprocs-migration/store";
import { env } from "../env.js";
import type { MessagesResult } from "../messages.js";
import { Card } from "./Card.js";

function MessageRow({ message }: { message: Message }) {
  return (
    <>
      <dt>{message.id}</dt>
      <dd>
        {message.status === "sent" ? (
          <span class="dl-ok">sent</span>
        ) : (
          <span class="dl-bad">queued</span>
        )}{" "}
        {message.to}: {message.body}
      </dd>
    </>
  );
}

function Rows({ result }: { result: MessagesResult }) {
  if (!result.ok) {
    return (
      <>
        <dt>api</dt>
        <dd class="dl-bad">{result.error}</dd>
      </>
    );
  }
  if (result.messages.length === 0) {
    return (
      <>
        <dt>none</dt>
        <dd>
          run <code>devlanes run seed</code>
        </dd>
      </>
    );
  }
  return (
    <>
      {result.messages.map((message) => (
        <MessageRow message={message} />
      ))}
    </>
  );
}

/** The messages the api holds, with their delivery status, or the error from the api. */
export function MessagesCard({ result }: { result: MessagesResult }) {
  return (
    <Card title={`GET ${env.apiUrl}/api/messages`}>
      <dl class="dl-rows">
        <Rows result={result} />
      </dl>
    </Card>
  );
}
