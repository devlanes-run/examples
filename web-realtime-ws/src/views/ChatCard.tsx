import { env } from "../env.js";
import { Card } from "./Card.js";

/** The chat over both WebSockets; `src/client/chat.ts` connects them and fills the log. */
export function ChatCard() {
  return (
    <Card title="echo, tagged with the lane">
      <dl class="dl-rows">
        <dt>ws port</dt>
        <dd id="state-ws">connecting</dd>
        <dt>main port</dt>
        <dd id="state-default">connecting</dd>
      </dl>
      <form class="chat" id="chat">
        <input id="text" autocomplete="off" placeholder={`Say something to lane ${env.lane}`} />
        <select id="via">
          <option value="ws">ws.{env.domain}</option>
          <option value="default">{env.domain}/ws</option>
        </select>
        <button>Send</button>
      </form>
      <pre class="chat-log" id="log" />
    </Card>
  );
}
