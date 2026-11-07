import { Hono } from "hono";
import { type CatalogResult, catalogClient, catalogLaneByHostname } from "../catalog.js";
import { env } from "../env.js";

/** The catalog answers the page shows, as JSON. */
export const apiRoutes = new Hono<{ Bindings: Env }>();

function body<T>(result: CatalogResult<T>) {
  return {
    gateway_lane: env.lane,
    catalog: result.ok ? result.data : { error: result.error },
  };
}

apiRoutes.get("/catalog", async (c) => c.json(body(await catalogClient(c.env.CATALOG).items())));

apiRoutes.get("/catalog-by-hostname", async (c) =>
  c.json(body(await catalogLaneByHostname(env.catalogUrl))),
);
