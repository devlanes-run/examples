# Cloudflare Vite plugin per lane

A React page and a [Hono](https://hono.dev) Worker served by one Vite dev server through `@cloudflare/vite-plugin`, with an inspector port and Worker state of their own in each lane. The Worker answers `/api/*` with mock items, a KV counter and the lane's values.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.12 or later

## Run it

```sh
cd frameworks-cloudflare-vite
devlanes start
```

`devlanes start --no-ui` prints the start as text:

```text
example-cloudflare-vite@0 (main): 1/1 ready
ready web http://127.0.0.1:20660 https://example-cloudflare-vite.localhost
```

Open https://example-cloudflare-vite.localhost. The page says `This is lane 0 of example-cloudflare-vite.` as the Worker reports it, and shows the Worker's items, a counter with a Count one more button, and the Worker's inspector port.

## During a start

1. The first start runs the `install` task (`npm install`).
2. `web` runs `vite` with the flags `preset: vite` adds (`--port <port> --strictPort --host 127.0.0.1`). The plugin starts workerd with the Worker from `src/worker/index.ts`, and `run_worker_first` in `wrangler.jsonc` sends `/api/*`, `/lane` and `/healthz` to it. Every other path is the React app.
3. `web` is ready once `/healthz` answers, which needs both Vite and the Worker.

https://example-cloudflare-vite.localhost serves the page and the Worker. https://inspect.example-cloudflare-vite.localhost reaches the Worker's DevTools inspector on the service's second port, `inspector`.

A Worker cannot read `process.env`, so `vite.config.ts` copies the lane variables into the Worker's `vars` with the plugin's `config` option.

## Values devlanes has to provide

The plugin's defaults assume one dev server per machine:

- `inspectorPort` defaults to 9229. When 9229 is taken, by another lane or by `node --inspect`, the plugin moves to the next free port and prints a warning, and `inspect.<lane domain>` cannot point at a port devlanes did not allocate. `devlanes.yaml` sets `INSPECTOR_PORT: ${{ self.ports.inspector }}`, which allocates a named port per lane, and `vite.config.ts` passes it to `inspectorPort`.
- `persistState` defaults to `.wrangler/state` in the worktree. Lanes in separate worktrees get separate folders, but lanes of one folder (`devlanes lane new --name`) would share one KV store. `vite.config.ts` sets `persistState: { path: "<DEVLANES_LANE_DATA>/cloudflare-state" }`, and the lane data folder belongs to one lane.

The dev registry, where workerd processes find each other for service bindings, needs nothing in this project. devlanes sets `CLOUDFLARE_DEV_REGISTRY_PATH`, which the plugin reads, plus `WRANGLER_REGISTRY_PATH` and `MINIFLARE_REGISTRY_PATH`, on every unit of every lane, all pointing at `wrangler-registry` in the lane data folder. Do not set them yourself.

```sh
devlanes env show web --lane 1 | grep -E "REGISTRY_PATH|INSPECTOR_PORT"
```

```text
CLOUDFLARE_DEV_REGISTRY_PATH=C:\Users\acme\.devlanes\data\example-cloudflare-vite\182\wrangler-registry
INSPECTOR_PORT=20701
MINIFLARE_REGISTRY_PATH=C:\Users\acme\.devlanes\data\example-cloudflare-vite\182\wrangler-registry
WRANGLER_REGISTRY_PATH=C:\Users\acme\.devlanes\data\example-cloudflare-vite\182\wrangler-registry
```

The inspect hostname sets `host_header: upstream`. Miniflare's inspector closes WebSockets whose `Host` is not `127.0.0.1` or `localhost`, so with the default `preserve` the DevTools connection through `inspect.example-cloudflare-vite.localhost` opens and closes at once.

## Try next

- Start a second lane in a new worktree:

  ```sh
  git worktree add ../examples-checkout -b feat/checkout
  cd ../examples-checkout/frameworks-cloudflare-vite
  devlanes start
  ```

  Or add a lane to this folder, which shares the worktree and `node_modules` with lane 0:

  ```sh
  devlanes lane new --name example-cloudflare-vite-review --start
  ```

  ```text
  created example-cloudflare-vite@1 named example-cloudflare-vite-review (main) at C:\Users\acme\examples
  example-cloudflare-vite@1 (main): 1/1 ready
  ready web http://127.0.0.1:20700 https://example-cloudflare-vite1.localhost
  ```

  https://example-cloudflare-vite1.localhost shows `This is lane 1 of example-cloudflare-vite.`, with its own inspector port and a counter that starts at 0.

- Click Count one more on lane 1, or post to it, and read lane 0's counter (on Windows, add `--ssl-revoke-best-effort` to `curl`):

  ```sh
  curl -fsS -X POST https://example-cloudflare-vite1.localhost/api/counter
  curl -fsS https://example-cloudflare-vite.localhost/api/counter
  ```

  ```text
  {"count":5}
  {"count":2}
  ```

  Both lanes run from one folder, and each keeps its count in its own data folder. `devlanes stop` and `devlanes start` keep the count.

- List each lane's inspector targets:

  ```sh
  curl -fsS https://inspect.example-cloudflare-vite1.localhost/json
  ```

  ```text
  [{"id":"3636ad46-b187-405f-9d96-1ec8ee1daf59-example-cloudflare-vite","type":"node","description":"workers","webSocketDebuggerUrl":"ws://127.0.0.1:20701/example-cloudflare-vite","devtoolsFrontendUrl":"https://devtools.devprod.cloudflare.dev/js_app?theme=systemPreferred&debugger=true&ws=127.0.0.1:20701/example-cloudflare-vite","devtoolsFrontendUrlCompat":"https://devtools.devprod.cloudflare.dev/js_app?theme=systemPreferred&debugger=true&ws=127.0.0.1:20701/example-cloudflare-vite","title":"Cloudflare Worker","faviconUrl":"https://workers.cloudflare.com/favicon.ico"}]
  ```

  Lane 0's list at https://inspect.example-cloudflare-vite.localhost/json names port 20661. The URLs carry `127.0.0.1` because the inspector builds them from the `Host` header, which `host_header: upstream` replaces.

- Rename an item in `src/worker/catalogue.ts` and save. `devlanes logs web` prints `[vite] hot updated: virtual:cloudflare/worker-entry`, `/api/items` returns the new name, and the counter keeps its value.
- Remove both lanes with `devlanes lane clean example-cloudflare-vite-review --yes` and `devlanes lane clean 0 --yes`. Cleaning a lane deletes its data folder, counter included.

## Files

- [`devlanes.yaml`](devlanes.yaml): the `install` task and `web` with `preset: vite`, both hostnames, `INSPECTOR_PORT` and the `VITE_*` values.
- [`vite.config.ts`](vite.config.ts): the plugin's `inspectorPort`, `persistState` path and the lane `vars`.
- [`wrangler.jsonc`](wrangler.jsonc): the Worker, its `COUNTER` KV binding, its vars and the paths that reach it before the assets.
- [`src/worker/`](src/worker): the Hono Worker. `index.ts` mounts `routes/`, `env.ts` reads the vars, `counter.ts` reads and writes the KV count.
- [`src/client/`](src/client): the React page. `api.ts` calls the Worker.

## Docs

- [Framework presets: Vite](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#vite)
- [Framework presets: Wrangler](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#wrangler), for the registry variables
- [Ports and environment: several ports for one service](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#several-ports-for-one-service)
- [Ports and environment: lane data folder](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#lane-data-folder)
- [Cloudflare Vite plugin API](https://developers.cloudflare.com/workers/vite-plugin/reference/api/)
