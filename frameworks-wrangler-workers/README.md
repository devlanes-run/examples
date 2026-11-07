# Two Cloudflare Workers with a service binding

A `gateway` worker renders the lane page and calls a `catalog` worker through a service binding; `catalog` returns mock items and counts views in KV. Both run under `wrangler dev` with `preset: wrangler` from one template. The example shows `wrangler.vars`, `wrangler.args` with `--persist-to` under `${{ lane.data_path }}`, the per-lane dev registry, an inspector hostname per worker with `port: inspector`, and `lanes.hosts_file: always`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or newer with npm (tested with Node 24 and npm 11 on Windows 11)

## Run it

```sh
cd frameworks-wrangler-workers
devlanes start
```

Open https://wrangler-workers.localhost. Each Git worktree of this repository is a lane with its own ports and hostnames, and the primary worktree is lane 0. The page shows lane 0 of `wrangler-workers`, the items and view count the gateway got from `catalog` through the binding, and the same catalog reached by hostname.

## During a start

1. The `install` task runs `npm install` in `gateway/` and in `catalog/` on the lane's first start (`when: lane.create`), as the steps `install-gateway` and `install-catalog`.
2. `catalog` and `gateway` run `npm run dev`, which is `wrangler dev`. The preset appends `--port <port> --inspector-port <inspector port>`, one `--var KEY:VALUE` per entry of `wrangler.vars`, then `wrangler.args`. Each counts as ready once `/healthz` answers, with a 180s timeout for a slow first bundle.
3. `catalog` serves https://catalog.wrangler-workers.localhost and keeps its KV namespace under `--persist-to ${{ lane.data_path }}/wrangler/catalog`. `gateway` serves https://wrangler-workers.localhost and the stylesheet and logo from `gateway/public` as static assets.

Workers do not see the process environment, so the lane card reads `DEVLANES_LANE`, `DEVLANES_LANE_NAME`, `LANE_LABEL`, `DEVLANES_SERVICE` and `PORT` from vars that the template passes with `--var`. The gateway also gets `PUBLIC_BASE_URL: ${{ self.public_url }}` and `CATALOG_URL: ${{ services.catalog.public_url }}`.

The binding in `gateway/wrangler.jsonc` names the worker `catalog`. `wrangler dev` looks it up in the dev registry, and the preset points `WRANGLER_REGISTRY_PATH` (and the Miniflare and Vite plugin equivalents) at `wrangler-registry` in the lane data folder, so each lane's gateway finds its own lane's catalog:

```sh
devlanes env show gateway | grep WRANGLER_REGISTRY_PATH
```

```text
WRANGLER_REGISTRY_PATH=C:\Users\acme\.devlanes\data\wrangler-workers\80\wrangler-registry
```

The number is the lane id, and your user folder replaces `acme`.

## The hosts file

The page's "by hostname" card is a plain `fetch` from the gateway to https://catalog.wrangler-workers.localhost. workerd sends `*.localhost` names to DNS, so on macOS and Linux that fetch needs the lane's hostnames in `/etc/hosts`, which `lanes.hosts_file: always` asks devlanes to write once `devlanes setup` has installed its helper. devlanes never writes the hosts file on Windows, so the key changes nothing there: Windows 11 answers every `*.localhost` name with loopback, and the card shows `0, same lane as this gateway` without it. The service binding uses no hostname and works either way. This example was run on Windows 11 only.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/frameworks-wrangler-workers && devlanes start`. This step was not run while writing the example. The same lane from this folder, which was run, is `devlanes lane new --name wrangler-workers-review --start` (lane names are unique per folder across projects, so a bare `review` may already be taken in this repository). Either way https://wrangler-workers1.localhost shows `This is lane 1 of wrangler-workers.` and its binding card says `1, same lane as this gateway`.
- Call the catalog through each gateway and watch the counters move apart. Each lane writes KV under its own data folder, also when both lanes run from this folder (on Windows, add `--ssl-revoke-best-effort` to `curl`):

  ```sh
  curl -fsS https://wrangler-workers.localhost/api/catalog | grep -E '"(gateway_lane|lane|views)"'
  curl -fsS https://wrangler-workers1.localhost/api/catalog | grep -E '"(gateway_lane|lane|views)"'
  ```

  ```text
    "gateway_lane": 0,
      "lane": 0,
      "views": 7,
    "gateway_lane": 1,
      "lane": 1,
      "views": 5,
  ```

- Stop lane 1's catalog with `devlanes stop wrangler-workers-review:catalog`. https://wrangler-workers1.localhost/api/catalog then answers `"error": "Error: Network connection lost."` instead of falling back to lane 0's catalog, and lane 0 keeps counting. `devlanes start wrangler-workers-review:catalog` brings it back; the binding answered again about 7 seconds after the catalog was ready, once Wrangler had rewritten its registry entry.
- Open https://inspect-gateway.wrangler-workers.localhost/json. It lists the gateway's DevTools target, with `"webSocketDebuggerUrl":"ws://127.0.0.1:20503/ws"` on lane 0. Wrangler refuses a DevTools WebSocket whose `Host` is not `localhost` or `127.0.0.1` (``Disallowed `Host` header``, status 401), so the inspector hostnames set `host_header: upstream`. The WebSocket upgrade then goes through the hostname:

  ```sh
  curl -sS -i -N --http1.1 --max-time 3 -H "Origin: https://devtools.devprod.cloudflare.dev" -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" https://inspect-gateway.wrangler-workers.localhost/ws
  ```

  ```text
  HTTP/1.1 101 Switching Protocols
  sec-websocket-accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
  upgrade: websocket
  connection: upgrade
  via: 1.1 devlanes.run
  ```

- Remove both lanes with `devlanes lane clean wrangler-workers-review --yes` and `devlanes lane clean 0 --yes`. Each takes its data folder with it, so the KV counters and the registry go too.

## Files

- `devlanes.yaml`: the `install` task, the `worker` template with `preset: wrangler`, the lane vars and `--persist-to`, both services with their hostnames and inspector hostnames, and `lanes.hosts_file`.
- `gateway/wrangler.jsonc`: the `CATALOG` service binding and the static assets folder.
- `gateway/src/index.js`: the page, `/api/catalog` (through the binding), `/api/catalog-by-hostname`, `/lane` and `/healthz`.
- `gateway/public/devlanes.css` and `gateway/public/logo.svg`: the devlanes look, copied from `_template`.
- `catalog/wrangler.jsonc`: the `VIEWS` KV namespace.
- `catalog/src/index.js`: `/` and `/api/items` with the mock items and view counter, `/lane` and `/healthz`.

## Docs

- [Framework presets: Wrangler](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#wrangler)
- [Ports and environment: lane data folder](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#lane-data-folder)
- [Hostnames and HTTPS: programs that cannot resolve *.localhost](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-that-cannot-resolve-localhost)
- [Windows: hostnames](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/windows.md#hostnames)
