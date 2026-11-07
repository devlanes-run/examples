import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./env.js";
import { productsFile } from "./products.js";

serve({ fetch: app.fetch, port: env.port, hostname: env.host }, (info) => {
  console.log(`${env.service} listening on http://${info.address}:${info.port}`);
  console.log(`${env.service} keeps its products in ${productsFile}`);
});
