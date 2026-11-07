const TIMEOUT_MS = 5_000;

/** A product as the catalog worker returns it. */
export type Item = {
  id: number;
  sku: string;
  name: string;
  price_cents: number;
};

/** The catalog's answer to `GET /api/items`. */
export type CatalogItems = {
  lane: number;
  views: number;
  items: Item[];
};

/** The part of the catalog's `GET /lane` answer the gateway shows. */
export type CatalogLane = {
  lane: number;
  url: string | null;
};

/** A catalog answer, or the error the page shows in its place. */
export type CatalogResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function readJson<T>(request: Promise<Response>): Promise<CatalogResult<T>> {
  try {
    const response = await request;
    if (!response.ok) {
      // The proxy's error pages run to many lines; the first one names the problem.
      const [summary] = (await response.text()).split("\n");
      return { ok: false, error: `catalog answered ${response.status}: ${summary}` };
    }
    return { ok: true, data: (await response.json()) as T };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

/** Calls the catalog worker behind the `CATALOG` service binding. */
export function catalogClient(binding: Fetcher) {
  return {
    /** Lists the items; every call counts a view in the catalog lane's KV. */
    items(): Promise<CatalogResult<CatalogItems>> {
      // The host is ignored: the binding delivers the request to the catalog worker that this
      // lane's dev registry lists.
      const request = binding.fetch("http://catalog/api/items", {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return readJson(request);
    },
  };
}

/**
 * Asks the catalog for its lane with an ordinary fetch to its lane hostname. workerd resolves the
 * name itself, which is what `lanes.hosts_file` in devlanes.yaml is for.
 */
export function catalogLaneByHostname(catalogUrl: string): Promise<CatalogResult<CatalogLane>> {
  return readJson(fetch(`${catalogUrl}/lane`, { signal: AbortSignal.timeout(TIMEOUT_MS) }));
}
