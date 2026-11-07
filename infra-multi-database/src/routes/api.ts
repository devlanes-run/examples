import { Hono } from "hono";
import { checkAll, stores } from "../stores/index.js";

/** `GET /api/stores`: each store's namespace for this lane and its health, as JSON. */
export const api = new Hono().get("/stores", async (c) => {
  const health = await checkAll();
  return c.json(
    stores.map((store) => {
      const check = health[store.key];
      return {
        store: store.key,
        container: store.container,
        kind: store.kind,
        namespace: store.namespace,
        env: store.envVar,
        ...store.access,
        ok: check.ok,
        health: check.ok ? check.value : check.error,
      };
    }),
  );
});
