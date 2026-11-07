import type { ProviderInfo } from "../oidc.js";
import type { Settled } from "../settle.js";
import { Card } from "./Card.js";

/** The lane's own OIDC provider container, as its discovery document describes it. */
export function ProviderCard({
  provider,
  port,
}: {
  provider: Settled<ProviderInfo>;
  port: number;
}) {
  return (
    <Card title="infra.containers.oidc">
      {"error" in provider ? (
        <pre class="dl-bad">{provider.error}</pre>
      ) : (
        <dl class="dl-rows">
          <dt>issuer</dt>
          <dd>
            <span class="dl-ok">{provider.value.issuer}</span>
          </dd>
          <dt>authorize</dt>
          <dd>{provider.value.authorize}</dd>
          <dt>token</dt>
          <dd>{provider.value.token}</dd>
          <dt>host port</dt>
          <dd>{port}</dd>
        </dl>
      )}
    </Card>
  );
}
