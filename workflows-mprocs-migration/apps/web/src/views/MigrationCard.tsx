import type { LaneInfo } from "@mprocs-migration/shared";
import { env } from "../env.js";

function Link({ href }: { href: string | null }) {
  return href ? <a href={href}>{href}</a> : <span class="dl-bad">not through the proxy</span>;
}

/** The Caddy hostnames and slot ports of the mprocs setup next to what this lane got. */
export function MigrationCard({ info }: { info: LaneInfo }) {
  return (
    <div class="dl-card">
      <dl class="dl-rows">
        <dt>web</dt>
        <dd>
          https://acme.localhost -&gt; <Link href={info.url} />
        </dd>
        <dt>api</dt>
        <dd>
          https://api.acme.localhost -&gt; <Link href={env.apiPublicUrl} />
        </dd>
        <dt>sms-stub</dt>
        <dd>
          https://sms.acme.localhost -&gt; <Link href={env.smsPublicUrl} />
        </dd>
        <dt>web port</dt>
        <dd>3000 + 100 &times; slot -&gt; {info.port}</dd>
      </dl>
    </div>
  );
}
