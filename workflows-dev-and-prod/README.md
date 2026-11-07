# Dev servers and production builds from one folder

A Vite + React page and a Node API that run three ways from the same checkout: as dev servers, as a production build in the same lane with `devlanes start --profile prod`, and as a second project, `dev-and-prod-release`, declared in `devlanes.prod.yaml` with `extends: devlanes.yaml`. It shows `profiles.<name>.run_scripts`, profile `env`, a `build` task with `when: lane.start` and `profiles`, the global `--file` flag, `-p <project>`, build output in `${{ lane.data_path }}`, and per-machine changes in `devlanes.local.yaml`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.12 or newer with npm (tested with Node 24 and npm 11)

## Run it

```sh
cd workflows-dev-and-prod
devlanes start
```

Open https://dev-and-prod.localhost. Each Git worktree of this repository is a lane with its own ports and hostnames, and the primary worktree is lane 0. The page shows lane 0 of `dev-and-prod` and two cards, one for `web` and one for `api`, with the npm script each one runs, `NODE_ENV`, the profile and the project file. The page reads them from the servers at load time, so they always describe the process that answered.

```sh
curl -fsS https://dev-and-prod.localhost/mode # on Windows, add --ssl-revoke-best-effort
```

```json
{
  "server": "vite dev server",
  "script": "dev",
  "node_env": "development",
  "profile": "default",
  "project_file": "devlanes.yaml",
  "out_dir": null,
  "api_url": "https://api.dev-and-prod.localhost"
}
```

## During a start

1. `install` runs `npm install --include=dev` in `web/` on the lane's first start (`when: lane.create`). The API uses only `node:http`.
2. `build` runs only when the `prod` profile is active (`profiles: [prod]`), so a plain start skips it.
3. The `default` profile selects every service with `include: ["*"]` and adds `NODE_ENV: development` and `APP_PROFILE: default` to their env.
4. `api` runs `npm run dev` (`node --watch server.mjs`) at https://api.dev-and-prod.localhost. `web` runs `npm run dev` (`vite`) at https://dev-and-prod.localhost with the flags `preset: vite` adds. Both count as ready once `/healthz` answers; `web` gets `/healthz`, `/lane` and `/mode` from a small plugin in `web/vite.config.js`, which works in `vite` and `vite preview` alike.

## The prod profile

`prod` runs the same services in the same lane from built code. `run_scripts: { dev: start }` makes every service whose `run_script` names `dev` run `start` from the same `package.json`: `node server.mjs` for `api` and `vite preview` for `web`. `preset: vite` adds the same `--port` flags to `vite preview`, so the hostname stays the same.

A start leaves running services alone, so on a lane that already runs the dev servers `devlanes start --profile prod` prints `ok already running; nothing was started`. Stop the lane first:

```sh
devlanes stop
devlanes start --profile prod --no-ui
```

```text
ok build
dev-and-prod@0 · main
ok services  2 of 2 ready
  ok  api  https://api.dev-and-prod.localhost
  ok  web  https://dev-and-prod.localhost
```

The page now says `as a production bundle that vite preview serves`, with `npm script start`, `bundle production` and `NODE_ENV production` on both cards:

```sh
curl -fsS https://api.dev-and-prod.localhost/mode
```

```json
{
  "script": "start",
  "watch": false,
  "node_env": "production",
  "profile": "prod",
  "project_file": "devlanes.yaml",
  "log_level": "info"
}
```

`devlanes stop` forgets the lane's profiles, so `devlanes stop` and a plain `devlanes start` bring the dev servers back.

## A second project file

`devlanes.prod.yaml` extends `devlanes.yaml` and names another project, `dev-and-prod-release`. Its `default` profile adds `run_scripts: { dev: start }` and `NODE_ENV: production`, and its `build` task runs with `profiles: [default]`, so a plain start of that project always builds and serves the bundle. devlanes only finds `devlanes.yaml` by itself, so name the file the first time:

```sh
devlanes --file devlanes.prod.yaml start
devlanes -p dev-and-prod-release status
```

```text
dev-and-prod-release
  LANE  BRANCH  STATE    SERVICES  CPU   MEM        URL
  0     main    running  2/2       0.0%  118.2 MiB  https://dev-and-prod-release.localhost

  UNIT     STATE   PORT   CPU   MEM       URL
  api      ready   20560  0.0%  49.2 MiB  https://api.dev-and-prod-release.localhost
  web      ready   20561  0.0%  69.1 MiB  https://dev-and-prod-release.localhost
  build    exited  –      –     –
  install  exited  –      –     –
```

It runs next to `dev-and-prod` in the same worktree with its own ports and hostnames: https://dev-and-prod-release.localhost shows `This is lane 0 of dev-and-prod-release.`, profile `default` and project file `devlanes.prod.yaml`, while https://dev-and-prod.localhost keeps its dev servers. After the first start, `-p dev-and-prod-release` finds the project from anywhere, as in `devlanes -p dev-and-prod-release logs api --tail 5`.

Both projects use the files of one folder:

- Build output: `vite build` writes to `WEB_OUT_DIR`, which `devlanes.yaml` sets to `${{ lane.data_path }}/web-dist`. The lane data folder is `~/.devlanes/data/<project>/<lane id>`, so each lane of each project serves its own build, and the page's `build output` row shows where. A `dist/` in `web/` would be one folder for all of them, and one project's build would replace the bundle the other serves.
- `web/node_modules`: every lane of both projects installs into it. `install` uses `npm install` rather than `npm ci`, which would delete it under a running Vite, and `--include=dev` because profile `env` reaches tasks too: with `NODE_ENV=production` npm leaves out devDependencies and removed `vite` from the shared folder.

## Local overrides

`devlanes.local.example.yaml` turns `web` off with `autostart: false`, adds `LOG_LEVEL: debug` to `api`'s env and adds a `scratch` service that only this machine runs. Copy it to `devlanes.local.yaml`, which Git ignores:

```sh
cp devlanes.local.example.yaml devlanes.local.yaml
devlanes status
```

```text
dev-and-prod
  LANE  BRANCH  STATE    SERVICES  CPU   MEM        URL
  0     main    running  2/3       0.0%  142.0 MiB  https://dev-and-prod.localhost  (config changed: 1 changed, 1 added; devlanes reload --lane dev-and-prod@0 applies it)

  UNIT     STATE   PORT   CPU   MEM       URL
  api      ready   20550  0.0%  56.1 MiB  https://api.dev-and-prod.localhost
  web      ready   20551  0.0%  85.9 MiB  https://dev-and-prod.localhost
  scratch  idle    20552  –     –         https://scratch.dev-and-prod.localhost
  build    exited  –      –     –
  install  exited  –      –     –
  api: env LOG_LEVEL changed in the project file
  scratch: added to the project file
```

`devlanes debug config` prints the merged config, starting with a `# from` line per file in merge order: `devlanes.yaml`, then `devlanes.local.yaml`. For `devlanes -p dev-and-prod-release debug config` the list is `devlanes.yaml`, `devlanes.local.yaml`, `devlanes.prod.yaml`, so the local file reaches the release project too, and `devlanes -p dev-and-prod-release status` shows the same two changes.

```sh
devlanes reload --no-ui
```

```text
dev-and-prod@0 · main
ok services  2 of 2 ready
  ok  api      https://api.dev-and-prod.localhost
  ok  scratch  https://scratch.dev-and-prod.localhost
```

The page's `api` card shows `LOG_LEVEL debug`, `devlanes logs api` shows a `debug: GET /mode` line per request, and https://scratch.dev-and-prod.localhost answers with its lane JSON. `web` keeps running, because `autostart: false` only skips a service the lane did not run before. After `devlanes stop` and `devlanes start`, `devlanes status` lists `web` as `stopped` and https://dev-and-prod.localhost answers with the proxy's `DL201 Service not running` page; `devlanes start web` starts it by name. Delete `devlanes.local.yaml` and run `devlanes reload` to go back.

## Try next

- Start a second lane in a new worktree. This is the one step not run while writing this README:

  ```sh
  git worktree add ../examples-checkout -b feat/checkout
  cd ../examples-checkout/workflows-dev-and-prod
  devlanes start
  ```

  The new worktree has no `node_modules` and no `devlanes.local.yaml`, so `install` runs there, and the lane uses the primary worktree's `devlanes.local.yaml` if you made one. To get a second lane without a worktree, run `devlanes lane new --name dev-and-prod-review --start` in this folder: https://dev-and-prod1.localhost shows `This is lane 1 of dev-and-prod.` with its API at https://api.dev-and-prod1.localhost.

- Run lane 1 in prod while lane 0 keeps its dev servers: `devlanes stop --lane dev-and-prod-review`, then `devlanes start --lane dev-and-prod-review --profile prod --no-ui`. https://dev-and-prod1.localhost shows `vite preview` with a build output folder of its own, and https://dev-and-prod.localhost still shows `vite dev server`.
- Remove the lanes with `devlanes lane clean dev-and-prod-review --yes`, `devlanes lane clean 0 --yes` and `devlanes -p dev-and-prod-release lane clean 0 --yes`.

## Files

- `devlanes.yaml`: `install` and `build` tasks, `api` and `web`, the `default` and `prod` profiles, `WEB_OUT_DIR` in the lane data folder.
- `devlanes.prod.yaml`: the `dev-and-prod-release` project, building and serving the bundle on a plain start.
- `devlanes.local.example.yaml`: per-machine overrides to copy to `devlanes.local.yaml`.
- `api/server.mjs`: the API on `node:http`, with `/`, `/mode`, `/api/releases`, `/lane` and `/healthz`.
- `web/vite.config.js`: `build.outDir` from `WEB_OUT_DIR`, and the plugin that adds `/healthz`, `/lane` and `/mode` to `vite` and `vite preview`.
- `web/src/App.jsx`: the page.
- `web/src/devlanes.css` and `web/public/logo.svg`: the devlanes look, copied from `_template`.
- `scratch/server.mjs`: the service only `devlanes.local.yaml` declares.

## Docs

- [Service patterns: several projects in one directory](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#several-projects-in-one-directory)
- [Ports and environment: local overrides](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#local-overrides)
- [Ports and environment: extending another project file](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#extending-another-project-file)
- [Run and run_script: profiles that swap scripts](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md#profiles-that-swap-scripts)
- [Framework presets: Vite](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#vite)
