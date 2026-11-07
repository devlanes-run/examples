/** The lane that answered for the catalog, green when it is the gateway's own lane. */
export function CatalogLane({ lane, gatewayLane }: { lane: number; gatewayLane: number }) {
  return lane === gatewayLane ? (
    <span class="dl-ok">{lane}, same lane as this gateway</span>
  ) : (
    <span class="dl-bad">{lane}, another lane</span>
  );
}
