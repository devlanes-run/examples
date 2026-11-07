import { env } from "../env.js";
import { Card } from "./Card.js";

/** The service's named ports and the hostname devlanes routes to each. */
export function PortsCard() {
  const { ports, domain } = env;
  return (
    <Card title="self.ports">
      <dl class="dl-rows">
        <dt>default</dt>
        <dd>
          {ports.default} at <a href={`https://${domain}`}>{domain}</a>: this page, /events and /ws
        </dd>
        <dt>ws</dt>
        <dd>
          {ports.ws} at wss://ws.{domain}: the chat below
        </dd>
        <dt>admin</dt>
        <dd>
          {ports.admin} at <a href={`https://admin.${domain}`}>admin.{domain}</a>: connections and
          messages as JSON
        </dd>
      </dl>
    </Card>
  );
}
