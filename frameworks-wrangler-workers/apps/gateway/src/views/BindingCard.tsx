import type { CatalogItems, CatalogResult } from "../catalog.js";
import { CatalogLane } from "./CatalogLane.js";

function price(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

type BindingCardProps = {
  result: CatalogResult<CatalogItems>;
  gatewayLane: number;
};

/** What the catalog returned through the service binding: its lane, view count and items. */
export function BindingCard({ result, gatewayLane }: BindingCardProps) {
  if (!result.ok) {
    return (
      <div class="dl-card">
        <dl class="dl-rows">
          <dt>error</dt>
          <dd class="dl-bad">{result.error}</dd>
        </dl>
      </div>
    );
  }
  const { lane, views, items } = result.data;
  return (
    <div class="dl-card">
      <dl class="dl-rows">
        <dt>catalog lane</dt>
        <dd>
          <CatalogLane lane={lane} gatewayLane={gatewayLane} />
        </dd>
        <dt>views</dt>
        <dd>
          <span class="dl-key">{views}</span> in this lane's KV
        </dd>
        {items.map((item) => (
          <>
            <dt>{item.sku}</dt>
            <dd>
              {item.name}, {price(item.price_cents)}
            </dd>
          </>
        ))}
      </dl>
    </div>
  );
}
