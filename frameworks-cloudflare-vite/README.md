# Cloudflare Vite plugin per lane

A React page and a Cloudflare Worker served by one Vite dev server through `@cloudflare/vite-plugin`. The Worker answers `/api/*` with mock items, a KV counter and the lane's values. It shows `preset: vite` with `run_script`, the plugin's inspector on `${{ self.ports.inspector }}` routed at `inspect.${{ lane.domain }}` with `port: inspector`, Worker state persisted in the lane data folder (`DEVLANES_LANE_DATA`), and the dev registry variables devlanes sets on every unit.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.12 or newer with npm (tested with Node 24 and npm 11 on Windows 11)

## Run it

```sh
cd frameworks-cloudflare-vite
devlanes start
```

Open https://cloudflare-vite.localhost. Each Git worktree of this repository is a lane with its own ports and hostnames, and the primary worktree is lane 0. The page shows lane 0 of `cloudflare-vite` as the Worker reports it, the Worker's items, a counter with a Count one more button, and the Worker's inspector port.

## During a start

1. The `install` task runs `npm install` on the lane's first start (`when: lane.create`).
2. `web` runs `vite` with the flags `preset: vite` adds (`--port <port> --strictPort --host 127.0.0.1`). The plugin starts workerd with the Worker from `worker/index.js`, and `run_worker_first` in `wrangler.jsonc` sends `/api/*`, `/lane` and `/healthz` to it. Every other path is the React app.
3. `web` counts as ready once `/healthz` answers, which needs both Vite and the Worker.

https://cloudflare-vite.localhost serves the page and the Worker. https://inspect.cloudflare-vite.localhost reaches the Worker's DevTools inspector on the service's second port, `inspector`.

The lane card comes from `GET /api/lane`. A Worker cannot read `process.env`, so `vite.config.js` copies `DEVLANES_LANE`, `DEVLANES_LANE_NAME`, `LANE_LABEL`, `PORT` and the rest into the Worker's `vars` with the plugin's `config` option. `url` comes from the `X-Forwarded-Host` header the devlanes proxy adds.

## Values devlanes has to provide

The plugin's defaults assume one dev server per machine:

- `inspectorPort` defaults to 9229. When 9229 is taken, by another lane or by `node --inspect`, the plugin moves to the next free port and prints a warning. devlanes did not allocate that port, so `inspect.<lane domain>` cannot point at it. `devlanes.yaml` sets `INSPECTOR_PORT: ${{ self.ports.inspector }}`, which allocates a named port per lane, and `vite.config.js` passes it to `inspectorPort`.
- `persistState` defaults to `.wrangler/state` in the worktree. Lanes in separate worktrees get separate folders, but lanes of one folder (`devlanes lane new --name`) would share one KV store. `vite.config.js` sets `persistState: { path: "<DEVLANES_LANE_DATA>/cloudflare-state" }`, and the lane data folder belongs to one lane.

The dev registry, where workerd processes find each other for service bindings, needs nothing in this project. devlanes sets `CLOUDFLARE_DEV_REGISTRY_PATH`, which the plugin reads, plus `WRANGLER_REGISTRY_PATH` and `MINIFLARE_REGISTRY_PATH`, on every unit of every lane, all pointing at `wrangler-registry` in the lane data folder. Do not set them yourself. The plugin writes a `cloudflare-vite` entry there once the Worker starts.

```sh
devlanes env show web --lane 1 | grep -E "REGISTRY_PATH|INSPECTOR_PORT"
```

```text
CLOUDFLARE_DEV_REGISTRY_PATH=C:\Users\acme\.devlanes\data\cloudflare-vite\89\wrangler-registry
INSPECTOR_PORT=20671
MINIFLARE_REGISTRY_PATH=C:\Users\acme\.devlanes\data\cloudflare-vite\89\wrangler-registry
WRANGLER_REGISTRY_PATH=C:\Users\acme\.devlanes\data\cloudflare-vite\89\wrangler-registry
```

The inspect hostname also sets `host_header: upstream`. Miniflare's inspector closes WebSockets whose `Host` is not `127.0.0.1` or `localhost`, so with the default `preserve` the DevTools connection through `inspect.cloudflare-vite.localhost` opens and closes at once.

## Try next

- Start a second lane in a new worktree. This step was not run for this README:

  ```sh
  git worktree add ../examples-checkout -b feat/checkout
  cd ../examples-checkout/frameworks-cloudflare-vite
  devlanes start
  ```

  Or add a lane to this folder, which shares the worktree and `node_modules` with lane 0:

  ```sh
  devlanes lane new --name cloudflare-vite-review --start
  ```

  ```text
  cloudflare-vite@1 (main): 1/1 ready
  ready web http://127.0.0.1:20670 https://cloudflare-vite1.localhost
  ```

  https://cloudflare-vite1.localhost shows `This is lane 1 of cloudflare-vite.`, with its own inspector port and a counter that starts at 0.

- Click Count one more on lane 1, or post to it, and read lane 0's counter (on Windows, add `--ssl-revoke-best-effort` to `curl`):

  ```sh
  curl -fsS -X POST https://cloudflare-vite1.localhost/api/counter
  curl -fsS https://cloudflare-vite.localhost/api/counter
  ```

  ```text
  {"count":3}
  {"count":2}
  ```

  Both lanes run from one folder, and each keeps its count in its own data folder. `devlanes stop` and `devlanes start` keep the count.

- List each lane's inspector targets:

  ```sh
  curl -fsS https://inspect.cloudflare-vite1.localhost/json
  ```

  ```text
  [{"id":"8199b5e0-aba8-4384-9f6c-5ff40e338289-cloudflare-vite","type":"node","description":"workers","webSocketDebuggerUrl":"ws://127.0.0.1:20671/cloudflare-vite","devtoolsFrontendUrl":"https://devtools.devprod.cloudflare.dev/js_app?theme=systemPreferred&debugger=true&ws=127.0.0.1:20671/cloudflare-vite","devtoolsFrontendUrlCompat":"https://devtools.devprod.cloudflare.dev/js_app?theme=systemPreferred&debugger=true&ws=127.0.0.1:20671/cloudflare-vite","title":"Cloudflare Worker","faviconUrl":"https://workers.cloudflare.com/favicon.ico"}]
  ```

  Lane 0's list at https://inspect.cloudflare-vite.localhost/json names port 20471. The URLs carry `127.0.0.1` because the inspector builds them from the `Host` header, which `host_header: upstream` replaces.

- Rename an item in `worker/index.js` and save. `devlanes logs web` prints `[vite] hot updated: virtual:cloudflare/worker-entry`, `/api/items` returns the new name, and the counter keeps its value.
- Remove both lanes with `devlanes lane clean cloudflare-vite-review --yes` and `devlanes lane clean 0 --yes`. Cleaning a lane deletes its data folder, counter included.

## Files

- `devlanes.yaml`: the `install` task and `web` with `preset: vite`, both hostnames and `INSPECTOR_PORT`.
- `vite.config.js`: the plugin's `inspectorPort`, `persistState` path and the lane `vars`.
- `wrangler.jsonc`: the Worker, its `COUNTER` KV binding and the paths that reach it before the assets.
- `worker/index.js`: `/healthz`, `/lane`, `/api/lane`, `/api/items` and `/api/counter`.
- `src/App.jsx`: the page.
- `src/devlanes.css` and `public/logo.svg`: the devlanes look, copied from `_template`.

## Docs

- [Framework presets: Vite](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#vite)
- [Framework presets: Wrangler](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#wrangler), for the registry variables
- [Ports and environment: several ports for one service](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#several-ports-for-one-service)
- [Ports and environment: lane data folder](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#lane-data-folder)
- [Cloudflare Vite plugin API](https://developers.cloudflare.com/workers/vite-plugin/reference/api/)
