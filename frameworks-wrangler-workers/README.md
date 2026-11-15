# Cloudflare Workers

A `gateway` worker renders the lane page and calls a `catalog` worker through a service binding; `catalog` returns mock items and counts views in KV. Both are TypeScript Workers built with [Hono](https://hono.dev) and run under `wrangler dev` with `preset: wrangler` from one template.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later

## Run it

```sh
cd frameworks-wrangler-workers
devlanes start
```

`devlanes start --no-ui` prints the start as text:

```text
example-wrangler-workers@0 (main): 2/2 ready
ready gateway http://127.0.0.1:20682 https://example-wrangler-workers.localhost
ready catalog http://127.0.0.1:20680 https://catalog.example-wrangler-workers.localhost
```

Open https://example-wrangler-workers.localhost. The page says `This is lane 0 of example-wrangler-workers.`, then shows the items and view count the gateway got from `catalog` through the binding, and the same catalog reached by hostname.

## During a start

1. The first start runs the `install` task, `npm install` at the example root for both workers. Its `postinstall` script runs `wrangler types` in each worker.
2. `catalog` and `gateway` run `npm run dev`, which is `wrangler dev`. The preset appends `--port <port> --inspector-port <inspector port>`, one `--var KEY:VALUE` per entry of `wrangler.vars`, then `wrangler.args`. Each is ready once `/healthz` answers, with a 180s timeout for a slow first bundle.
3. `catalog` serves https://catalog.example-wrangler-workers.localhost and keeps its KV namespace under `--persist-to ${{ lane.data_path }}/wrangler/catalog`. `gateway` serves https://example-wrangler-workers.localhost.

Workers do not see the process environment, so the template passes the lane values with `--var`, and `src/env.ts` in each worker reads them and fails on load when one is missing. The gateway also gets `PUBLIC_BASE_URL: ${{ self.public_url }}` and `CATALOG_URL: ${{ services.catalog.public_url }}`.

## Service binding and dev registry

The binding in `apps/gateway/wrangler.jsonc` names the worker `catalog`, which `wrangler dev` looks up in the dev registry. The preset points `WRANGLER_REGISTRY_PATH` (and the Miniflare and Vite plugin equivalents) at `wrangler-registry` in the lane data folder, so each lane's gateway finds its own lane's catalog:

```sh
devlanes env show gateway | grep WRANGLER_REGISTRY_PATH
```

```text
WRANGLER_REGISTRY_PATH=C:\Users\acme\.devlanes\data\example-wrangler-workers\177\wrangler-registry
```

The number is the lane id, and your user folder replaces `acme`.

## Reaching the catalog by hostname

The page's "By hostname" card is a plain `fetch` from the gateway to https://catalog.example-wrangler-workers.localhost. workerd sends `*.localhost` names to DNS, so on macOS and Linux that fetch needs the lane's hostnames in `/etc/hosts`. `lanes.hosts_file: always` asks devlanes to write them once `devlanes setup` has installed its helper. devlanes never writes the hosts file on Windows, so the key changes nothing there: Windows 11 answers every `*.localhost` name with loopback, and the card shows `0, same lane as this gateway` without it. The service binding uses no hostname and works either way. This example was run on Windows 11 only.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/frameworks-wrangler-workers && devlanes start`. From this folder, `devlanes lane new --name example-wrangler-workers-review --start` gives the same lane (lane names are unique per folder across projects, so a bare `review` may already be taken in this repository). https://example-wrangler-workers1.localhost shows `This is lane 1 of example-wrangler-workers.` and its binding card says `1, same lane as this gateway`.
- Call each gateway and compare the counters. Each lane keeps its KV under its own data folder, also when both lanes run from this folder (on Windows, add `--ssl-revoke-best-effort` to `curl`):

  ```sh
  curl -fsS https://example-wrangler-workers.localhost/api/catalog | grep -o '"gateway_lane":[0-9]*,"catalog":{"lane":[0-9]*,"views":[0-9]*'
  curl -fsS https://example-wrangler-workers1.localhost/api/catalog | grep -o '"gateway_lane":[0-9]*,"catalog":{"lane":[0-9]*,"views":[0-9]*'
  ```

  ```text
  "gateway_lane":0,"catalog":{"lane":0,"views":9
  "gateway_lane":1,"catalog":{"lane":1,"views":6
  ```

- Stop lane 1's catalog with `devlanes stop example-wrangler-workers-review:catalog`. https://example-wrangler-workers1.localhost/api/catalog then answers `{"gateway_lane":1,"catalog":{"error":"Error: Network connection lost."}}` instead of falling back to lane 0's catalog, and the page's "By hostname" card shows `catalog answered 503: # DL201 Service not running`. Lane 0 keeps counting.
- Bring the catalog back with `devlanes start example-wrangler-workers-review:catalog`. The hostname answers as soon as the catalog is ready; the binding answered again between 20 and 80 seconds later in these runs, once the gateway's Wrangler had picked up the catalog's new registry entry.
- Open https://inspect-gateway.example-wrangler-workers.localhost/json. It lists the gateway's DevTools target, with `"webSocketDebuggerUrl":"ws://127.0.0.1:20683/ws"` on lane 0. Wrangler refuses a DevTools WebSocket whose `Host` is not `localhost` or `127.0.0.1` (``Disallowed `Host` header``, status 401), so the inspector hostnames set `host_header: upstream` and the upgrade goes through:

  ```sh
  curl -sS -i -N --http1.1 --max-time 3 -H "Origin: https://devtools.devprod.cloudflare.dev" -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" https://inspect-gateway.example-wrangler-workers.localhost/ws
  ```

  ```text
  HTTP/1.1 101 Switching Protocols
  sec-websocket-accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
  upgrade: websocket
  connection: upgrade
  via: 1.1 devlanes.run
  ```

- Remove both lanes with `devlanes lane clean example-wrangler-workers-review --yes` and `devlanes lane clean 0 --yes`. Each takes its data folder with it, so the KV counters and the registry go too.

## Files

- [`devlanes.yaml`](devlanes.yaml): the `install` task, the `worker` template with `preset: wrangler`, the lane vars and `--persist-to`, both services with their hostnames and inspector hostnames, and `lanes.hosts_file`.
- [`apps/gateway/wrangler.jsonc`](apps/gateway/wrangler.jsonc): the `CATALOG` service binding.
- [`apps/gateway/src/catalog.ts`](apps/gateway/src/catalog.ts): the typed client for the catalog, through the binding and by hostname, with timeouts.
- [`apps/gateway/src/routes/`](apps/gateway/src/routes): the page and the `/api/catalog` and `/api/catalog-by-hostname` JSON routes.
- [`apps/catalog/wrangler.jsonc`](apps/catalog/wrangler.jsonc): the `VIEWS` KV namespace.
- [`apps/catalog/src/`](apps/catalog/src): `/` with the mock items, `/api/items` with the view counter, `/lane` and `/healthz`.

## Docs

- [Framework presets: Wrangler](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#wrangler)
- [Ports and environment: lane data folder](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#lane-data-folder)
- [Hostnames and HTTPS: programs that cannot resolve \*.localhost](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-that-cannot-resolve-localhost)
- [Windows: hostnames](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/windows.md#hostnames)
