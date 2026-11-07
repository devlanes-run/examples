import type { CatalogItems, CatalogLane, CatalogResult } from "../catalog.js";
import { env } from "../env.js";
import type { LaneInfo } from "../lane.js";
import { BindingCard } from "./BindingCard.js";
import { ByHostnameCard } from "./ByHostnameCard.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

type HomePageProps = {
  info: LaneInfo;
  items: CatalogResult<CatalogItems>;
  byHostname: CatalogResult<CatalogLane>;
};

/** The gateway's lane page, with the catalog reached through the binding and by hostname. */
export function HomePage({ info, items, byHostname }: HomePageProps) {
  const inspector = (worker: string) => `https://inspect-${worker}.${env.domain}/json`;
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="frameworks-wrangler-workers"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> worker answered from the worktree on{" "}
        <code>{info.branch}</code> and called the <code>catalog</code> worker of the same lane.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Through the service binding</h2>
      <p class="dl-lede">
        <code>env.CATALOG.fetch("/api/items")</code> reaches the catalog that this lane's dev
        registry lists, with no hostname involved.
      </p>
      <BindingCard result={items} gatewayLane={info.lane} />

      <h2 class="dl-h2">By hostname</h2>
      <p class="dl-lede">
        <code>fetch("{env.catalogUrl}/lane")</code> goes through the devlanes proxy like a browser
        request.
      </p>
      <ByHostnameCard result={byHostname} gatewayLane={info.lane} />

      <h2 class="dl-h2">Links</h2>
      <div class="dl-card">
        <dl class="dl-rows">
          <dt>catalog</dt>
          <dd>
            <a href={env.catalogUrl}>{env.catalogUrl}</a>
          </dd>
          <dt>as JSON</dt>
          <dd>
            <a href="/api/catalog">{env.publicBaseUrl}/api/catalog</a>
            <br />
            <a href="/api/catalog-by-hostname">{env.publicBaseUrl}/api/catalog-by-hostname</a>
          </dd>
          <dt>inspectors</dt>
          <dd>
            <a href={inspector("gateway")}>{inspector("gateway")}</a>
            <br />
            <a href={inspector("catalog")}>{inspector("catalog")}</a>
          </dd>
        </dl>
      </div>
    </Layout>
  );
}
