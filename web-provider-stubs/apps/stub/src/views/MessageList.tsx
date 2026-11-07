import type { Message } from "../inbox.js";

type MessageListProps = {
  messages: readonly Message[];
  fields: readonly string[];
  appUrl: string;
};

/** The inbox's messages, one block of rows each, or a hint to send one from the api. */
export function MessageList({ messages, fields, appUrl }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <pre>
        No messages yet. Send one from <a href={appUrl}>{appUrl}</a>.
      </pre>
    );
  }
  return (
    <>
      {messages.map((message, index) => (
        <>
          {index > 0 && <hr class="split" />}
          <dl class="dl-rows">
            <dt>id</dt>
            <dd>{message.id}</dd>
            <dt>received</dt>
            <dd>{message.received_at}</dd>
            {fields.map((field) => (
              <>
                <dt>{field}</dt>
                <dd>{message[field]}</dd>
              </>
            ))}
          </dl>
        </>
      ))}
    </>
  );
}
