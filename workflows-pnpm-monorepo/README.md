# pnpm workspace with turbo and a second project

A pnpm workspace scaled down from a SaaS monorepo: a Node API and two Vite apps in `apps/`, two shared packages in `packages/` that turbo builds, and a billing app in `apps/billing` that is a devlanes project of its own. It shows `install` and `build-deps` tasks on `when: lane.create`, a `run_script` per package, `templates` with `extends` and `tags`, `preset: vite`, turbo hashing the lane's `VITE_*` values, and two projects linked through `projects.<project>.services`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 24 and pnpm 11 (tested with Node 24.16 and pnpm 11.21.0, the version `packageManager` names). turbo, Vite and TypeScript are devDependencies.

## Run it

```sh
cd workflows-pnpm-monorepo
devlanes start
```

Open https://pnpm-monorepo.localhost. Each Git worktree of this repository is a lane with its own ports and hostnames, and the primary worktree is lane 0. The page shows lane 0 of `pnpm-monorepo`, the accounts it fetched from https://api.pnpm-monorepo.localhost and links to https://admin.pnpm-monorepo.localhost and to the billing app. Until a lane of the billing project runs, the billing row says `no lane of pnpm-billing runs`.

With `--no-ui`, the first start prints:

```text
✓ install
✓ build-deps
pnpm-monorepo@0 · main
✓ services  3 of 3 ready
  ✓  api    https://api.pnpm-monorepo.localhost
  ✓  web    https://pnpm-monorepo.localhost
  ✓  admin  https://admin.pnpm-monorepo.localhost
```

## During a start

1. `install` runs `pnpm install --frozen-lockfile` for the whole workspace.
2. `build-deps` runs the root `build-deps` script, `turbo run build --filter=./packages/*`: `tsc` compiles `@acme/config` and `@acme/ui` into `packages/*/dist`, which the apps import. Both tasks have `when: lane.create`, so they run on a lane's first start until they succeed once, and a fresh worktree needs only `devlanes start`.
3. `api` extends the `api` template (`tags: [api]`, a ready check on `/healthz`) and runs `node --watch src/server.ts` in `apps/api`; Node 24 strips the types. It reads `PORT`, `HOST` and the lane variables through `serverEnv()` from `@acme/config`, sends CORS headers to the origins in `DEVLANES_ORIGINS`, and serves https://api.pnpm-monorepo.localhost.
4. `web` and `admin` extend the `web` template (`preset: vite`, `tags: [web]`, a ready check on `/`) and run `vite` in `apps/web` and `apps/admin`, on https://pnpm-monorepo.localhost and https://admin.pnpm-monorepo.localhost. Both pages are built from the `Page`, `Card` and `LaneCard` components and `devlanes.css` of `@acme/ui`.

Every service points `run_script.file` at its own `package.json`, and devlanes runs the script with pnpm, from `packageManager` in the root `package.json`. The lane card reads `VITE_PROJECT`, `VITE_LANE`, `VITE_LANE_NAME` and `VITE_LANE_LABEL` from `global_env` and `VITE_SERVICE` and `VITE_PORT` from the `web` template, through `pageEnv()` in `@acme/config`, and takes `url` from `window.location.origin`.

## Lane values in turbo's cache key

`global_env` sets the lane's index and URLs as `VITE_*` on every service and task, and `vite build` copies them into the bundle: lane 1's `apps/web/dist` calls `https://api.pnpm-monorepo1.localhost`. `turbo.json` lists `VITE_*` in `globalEnv`, so they are part of every task's hash and a lane never replays another lane's bundle. `DEVLANES_*` is in `globalPassThroughEnv`: turbo's strict env mode hides variables it is not told about, and pass-through hands them to scripts without hashing them.

`devlanes run build` runs `turbo run build` with the lane's environment. A second run in the same lane replays all four builds from the cache and ends with `FULL TURBO`. Run in the second lane from "Try next", the packages hit the cache that lane's `build-deps` filled and both apps rebuild:

```text
build#8 @acme/ui:build: cache hit, replaying logs 8f453f85f700373c
build#10 @acme/config:build: cache hit, replaying logs 5f91104b9e13f4b3
build#12 @acme/web:build: cache miss, executing 7aa8da5c45dff168
build#13 @acme/admin:build: cache miss, executing b06cd2226605b1e0
```

`globalEnv` applies to every task, so any change to a `VITE_*` value rebuilds `packages/*` too. Starting pnpm-billing changes `VITE_BILLING_URL`, and the next `devlanes run build` in lane 0 reported `Cached:    0 cached, 4 total`.

## A second project in apps/billing

`apps/billing/devlanes.yaml` declares `project: pnpm-billing`. Commands run anywhere under `apps/billing` use it, the nearest `devlanes.yaml`, and the rest of the example uses the root one. pnpm-billing has its own lanes, ports and domain, `pnpm-billing.localhost`, and its relative paths start at `apps/billing`, so `run_script.file: package.json` is `apps/billing/package.json`. Its `install` task runs `pnpm install` from `apps/billing`, which installs the whole workspace, and its `build-deps` builds only what billing imports with `turbo run build --filter=@acme/billing^...`.

The two projects read each other's URLs through `projects.<project>.services`, with the dash in the project name written as an underscore:

```yaml
VITE_BILLING_URL: ${{ projects.pnpm_billing.services.web.public_url | default('') }}
```

The value is set when the service starts and is empty while no lane of pnpm-billing runs. `apps/billing/devlanes.yaml` does the same in the other direction with `projects.pnpm_monorepo.services.web.public_url`.

## Try next

- Start the billing project: `cd apps/billing && devlanes start`. https://pnpm-billing.localhost shows `This is lane 0 of pnpm-billing.`, three invoices and a link back to https://pnpm-monorepo.localhost. Still in `apps/billing`, `devlanes -p pnpm-monorepo restart web` restarts the root project's `web`, which now gets the billing URL, and the billing row on https://pnpm-monorepo.localhost becomes a link:

  ```sh
  devlanes -p pnpm-monorepo env show web | grep VITE_BILLING_URL
  ```

  ```text
  VITE_BILLING_URL=https://pnpm-billing.localhost
  ```

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/workflows-pnpm-monorepo && devlanes start`. The new worktree has no `node_modules` or `packages/*/dist`, and the `lane.create` tasks create them. This step was not run for this README. Without a worktree, `devlanes lane new --name pnpm-monorepo-review --start` adds lane 1 to the same folder: https://pnpm-monorepo1.localhost shows `This is lane 1 of pnpm-monorepo.` and `200 from lane 1` from https://api.pnpm-monorepo1.localhost. `cd apps/billing && devlanes lane new --name pnpm-billing-review --start` does the same for billing on https://pnpm-billing1.localhost. Lanes added to one folder are all on `main`, and each lane 1 links to lane 0 of the other project.
- From the example's root, `devlanes status` lists the root project's lanes and `devlanes -p pnpm-billing status` the billing project's:

  ```text
  pnpm-billing
    LANE  BRANCH  STATE    SERVICES  CPU   MEM        URL
    0     main    running  1/1       0.0%  120.7 MiB  https://pnpm-billing.localhost
    1     main    running  1/1       0.0%  121.0 MiB  https://pnpm-billing1.localhost
  ```

- Edit the footer in `packages/ui/src/index.tsx` and run `devlanes run build-deps`. turbo rebuilds `@acme/ui` (`cache miss`) and replays `@acme/config`, Vite logs `hmr update /@fs/.../packages/ui/dist/index.js`, and https://pnpm-monorepo.localhost and https://admin.pnpm-monorepo.localhost show the new footer. So does https://pnpm-monorepo1.localhost, because lanes in one folder share `packages/*/dist`.
- `devlanes run typecheck` runs `tsc --noEmit` in all six packages through `turbo run typecheck`, after building `packages/*`.
- Remove the lanes: `devlanes lane clean pnpm-monorepo-review --yes` and `devlanes lane clean 0 --yes` here, then `devlanes -p pnpm-billing lane clean pnpm-billing-review --yes` and `devlanes -p pnpm-billing lane clean 0 --yes`.

## Files

- `devlanes.yaml`: the root project, with the `VITE_*` lane values in `global_env`, the `install`, `build-deps`, `typecheck` and `build` tasks, the `api` and `web` templates and three services.
- `apps/billing/devlanes.yaml`: the `pnpm-billing` project with its own `install` and `build-deps` and one service.
- `turbo.json`: `globalEnv` and `globalPassThroughEnv`, and the `build` and `typecheck` tasks.
- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`: the workspace, `packageManager` and the root scripts.
- `packages/config/src/index.ts`: `serverEnv()`, `pageEnv()` and `laneJson()`.
- `packages/ui/src/index.tsx`, `packages/ui/devlanes.css`, `packages/ui/logo.svg`: the shared page components and look.
- `apps/api/src/server.ts`: the API with `/api/accounts`, `/lane` and `/healthz`.
- `apps/web/src/App.tsx`, `apps/admin/src/App.tsx`: the two Vite pages.
- `apps/billing/src/server.ts`: the server-rendered billing page, `/api/invoices`, `/lane` and `/healthz`.

## Docs

- [Service patterns: monorepo with several apps](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#monorepo-with-several-apps)
- [Lane lifecycle: lifecycle tasks](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#lifecycle-tasks)
- [Run and run_script: package.json](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md#packagejson)
- [Service patterns: tags, profiles and templates](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#tags-profiles-and-templates)
- [Ports and environment: reading other services](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#reading-other-services)
- [Framework presets: Vite](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#vite)
