import type { Settled } from "../settle.js";
import type { WhoamiInfo } from "../whoami.js";
import { Card } from "./Card.js";

/** The whoami container every lane shares: the URL this lane calls and the container that answered. */
export function WhoamiCard({ shared, url }: { shared: Settled<WhoamiInfo>; url: string }) {
  return (
    <Card title="infra.containers.whoami">
      {"error" in shared ? (
        <pre class="dl-bad">{shared.error}</pre>
      ) : (
        <dl class="dl-rows">
          <dt>url</dt>
          <dd>{url}</dd>
          <dt>hostname</dt>
          <dd>
            <span class="dl-key">{shared.value.hostname}</span>
          </dd>
        </dl>
      )}
    </Card>
  );
}
