// A server devlanes does not run: start it with `devlanes exec --name docs-server -- npm run docs`,
// and devlanes.local.yaml routes docs.<lane domain> of every lane to it.
import { serve } from "@hono/node-server";
import { docsApp } from "../routes/docs.js";

/** The port from the command line, which must match the address in devlanes.local.yaml. */
function parsePort(arg: string | undefined): number {
  const port = Number(arg);
  if (!Number.isInteger(port) || port <= 0) {
    console.error("usage: tsx src/scripts/docs-server.ts <port>");
    process.exit(2);
  }
  return port;
}

// Exec units get no PORT, and the port is fixed by infra.external anyway.
const port = parsePort(process.argv[2]);

serve({ fetch: docsApp(port).fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`docs listening on http://${info.address}:${info.port}`);
});
