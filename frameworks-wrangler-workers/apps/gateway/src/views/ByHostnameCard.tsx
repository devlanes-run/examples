import type { CatalogLane as CatalogLaneAnswer, CatalogResult } from "../catalog.js";
import { CatalogLane } from "./CatalogLane.js";

type ByHostnameCardProps = {
  result: CatalogResult<CatalogLaneAnswer>;
  gatewayLane: number;
};

/** What the catalog returned for a plain fetch to its lane hostname. */
export function ByHostnameCard({ result, gatewayLane }: ByHostnameCardProps) {
  return (
    <div class="dl-card">
      <dl class="dl-rows">
        {result.ok ? (
          <>
            <dt>catalog lane</dt>
            <dd>
              <CatalogLane lane={result.data.lane} gatewayLane={gatewayLane} />
            </dd>
            <dt>url</dt>
            <dd class="dl-url">{result.data.url ?? "not through the proxy"}</dd>
          </>
        ) : (
          <>
            <dt>error</dt>
            <dd class="dl-bad">{result.error}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
