import { Card } from "./Card.js";

/** The `/events` stream; `src/client/events.ts` fills in the values. */
export function EventsCard() {
  return (
    <Card title="GET /events">
      <dl class="dl-rows">
        <dt>stream</dt>
        <dd id="sse-state">connecting</dd>
        <dt>last tick</dt>
        <dd id="sse-tick">none yet</dd>
        <dt>received</dt>
        <dd id="sse-age">-</dd>
      </dl>
    </Card>
  );
}
