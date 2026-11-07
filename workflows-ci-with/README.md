# Run tests against a lane with devlanes with

A [Hono](https://hono.dev) API and a Hono page that calls it, plus `node:test` tests in TypeScript that call both over HTTPS. `devlanes with --profile e2e -- npm test` starts the lane, runs the tests with `DEVLANES_PUBLIC_URL_API` and `DEVLANES_PUBLIC_URL_WEB` set, stops the lane and exits with the tests' code. The `e2e` profile swaps each service's `dev` script for `start` with `run_scripts` and sets `NODE_ENV: test`, and a task with `profiles: [e2e]` builds the apps first. `github-workflow.yml` runs the same thing in GitHub Actions with [devlanes-run/action](https://github.com/devlanes-run/action).

## Requirements

- devlanes 0.11.3 or newer, with `devlanes setup` run once
- Node 22 or newer with npm (tested with Node 24 and npm 11)

## Run it

```sh
cd workflows-ci-with
devlanes with --profile e2e --logs-dir devlanes-logs -- npm test
```

```text
example-ci-with@0 (main): 2/2 ready
ready api http://127.0.0.1:20570 https://api.example-ci-with.localhost
ready web http://127.0.0.1:20571 https://example-ci-with.localhost

> test
> tsx --test tests/*.test.ts

✔ devlanes with sets the lane's public URLs (0.8353ms)
✔ api answers /lane for this lane through the proxy (75.5913ms)
✔ web answers /lane for this lane through the proxy (8.6627ms)
✔ api runs the e2e profile's start script with NODE_ENV=test (2.941ms)
✔ api allows the web origin of this lane (7.8003ms)
✔ api sends no CORS header to another origin (2.6371ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 288.3844
devlanes with · example-ci-with@0 · exit 0
UNIT  STATE  RUN TIME  AVG CPU  PEAK CPU   AVG MEM  PEAK MEM
api   ready        2s     0.0%      0.0%  54.2 MiB  54.2 MiB
web   ready        2s     3.1%      3.1%  62.5 MiB  62.6 MiB
```

The exit code is 0. devlanes calls each Git worktree of the repository a lane, with its own ports and hostnames, and the primary worktree is lane 0. The table at the end appears when the output is not a terminal, as in CI logs; in GitHub Actions devlanes also adds it to the step summary.

To open the page instead, run `devlanes start` and open https://example-ci-with.localhost. It shows lane 0 of `example-ci-with`, the `npm run dev` script and the answer the browser fetched from https://api.example-ci-with.localhost.

## During a with run

1. The first start of a lane runs the `install` task (`npm install` at the workspace root), because a new worktree has no `node_modules`.
2. The `e2e` profile is active, so the `build` task runs too: `npm run build` compiles both apps to `dist/` and bundles the page's browser code with Vite. A plain `devlanes start` skips it.
3. devlanes starts the services the profile includes (`"*"`, so both). `run_scripts: { dev: start }` makes `api` and `web` run `npm run start` (`node dist/index.js`) instead of `npm run dev` (`tsx watch src/index.ts`), and the profile's `env` gives both `NODE_ENV=test`.
4. It waits until both `/healthz` checks pass. If a service fails, `with` prints the failure and exits 1 without running the tests.
5. It runs `npm test` with the lane's environment: `DEVLANES_PUBLIC_URL_API=https://api.example-ci-with.localhost`, `DEVLANES_PUBLIC_URL_WEB=https://example-ci-with.localhost`, `DEVLANES_LANE` and the other lane variables, and `NODE_EXTRA_CA_CERTS` pointing at the devlanes CA, so `fetch` trusts the proxy's certificates. Services do not get the `DEVLANES_PUBLIC_URL_*` variables; `web` reads the API's address from `API_URL: ${{ services.api.public_url }}`.
6. It writes each unit's log to `devlanes-logs/`, stops what it started and exits with `npm test`'s code.

The tests in `tests/lane.test.ts` never name a hostname; `tests/env.ts` reads them from the `DEVLANES_PUBLIC_URL_*` variables. They check that each service's `/lane` answers for this lane through the proxy, that the API ran the `start` script with `NODE_ENV=test` (npm puts the script name in `npm_lifecycle_event`), and that the API sends `Access-Control-Allow-Origin` to the page's origin and not to `https://example.invalid`. The API builds that allow-list from `DEVLANES_ORIGINS`.

## A failing run

Start only `api` and the `web` test fails, so `with` exits 1:

```sh
devlanes with --profile e2e api --logs-dir devlanes-logs -- npm test
```

```text
example-ci-with@0 (main): 1/1 ready
ready api http://127.0.0.1:20570 https://api.example-ci-with.localhost

> test
> tsx --test tests/*.test.ts

✔ devlanes with sets the lane's public URLs (0.8604ms)
✔ api answers /lane for this lane through the proxy (54.4561ms)
✖ web answers /lane for this lane through the proxy (7.9696ms)
✔ api runs the e2e profile's start script with NODE_ENV=test (2.5306ms)
✔ api allows the web origin of this lane (6.8869ms)
✔ api sends no CORS header to another origin (2.9511ms)
ℹ tests 6
ℹ suites 0
ℹ pass 5
ℹ fail 1
...
✖ web answers /lane for this lane through the proxy (7.9696ms)
  AssertionError [ERR_ASSERTION]: https://example-ci-with.localhost/lane answered 503
...
devlanes with · example-ci-with@0 · exit 1
UNIT  STATE  RUN TIME  AVG CPU  PEAK CPU   AVG MEM  PEAK MEM
api   ready        2s     1.6%      1.6%  54.2 MiB  54.2 MiB
```

`DEVLANES_PUBLIC_URL_WEB` is still set, because devlanes sets it for every service in `devlanes.yaml`, and the proxy answers 503 for a service that is not running.

## Logs

`--logs-dir` writes one file per unit. The folder is in this example's `.gitignore`.

```sh
ls devlanes-logs
cat devlanes-logs/unit-api.log
```

```text
unit-api.log
unit-web.log

> start
> node dist/index.js

api listening on http://127.0.0.1:20570
CORS origins: https://api.example-ci-with.localhost, http://localhost:20570, http://127.0.0.1:20570, https://example-ci-with.localhost, http://localhost:20571, http://127.0.0.1:20571
```

devlanes does not empty the folder first. After the failing run above, `unit-api.log` was new and `unit-web.log` was still the one from the run before, so delete the folder between local runs when you read it. A CI job starts from a clean checkout.

## GitHub Actions

`github-workflow.yml` is a workflow to copy into `.github/workflows/`. The examples repository's own CI does not run it, and it has not been run for this example. It checks out the repository, sets up Node 24 and runs `devlanes-run/action@v0` with `command: with`, `profile: e2e` and `run: npm test`. `working-directory: workflows-ci-with` points the action at this folder's `devlanes.yaml`; use `.` when the file is at the repository root. The step fails when the tests fail, and the action then uploads the unit logs, the daemon's log and the output of `devlanes doctor` as an artifact. On Linux runners the action trusts the devlanes CA and lets the proxy use port 443, so the URLs match the ones above.

## Ad-hoc checks with exec

Against a lane that is already running, an agent or a script runs a one-off command as a unit of the lane with `devlanes exec`. The command gets the `DEVLANES_PUBLIC_URL_*` variables, and `devlanes logs` and `devlanes status` show its output and state:

```sh
devlanes start --no-ui
devlanes wait web --timeout 2m
devlanes exec --name smoke -- node --use-system-ca --import tsx tests/smoke.ts
```

A few seconds later, `devlanes logs smoke` prints:

```text
smoke#1 api https://api.example-ci-with.localhost/healthz 200 ok
smoke#2 web https://example-ci-with.localhost/healthz 200 ok
```

and `devlanes status` lists `smoke` next to the services and tasks:

```text
example-ci-with
  LANE  BRANCH  STATE    SERVICES  CPU   MEM        URL
  0     main    running  2/2       0.0%  165.2 MiB  https://example-ci-with.localhost

  UNIT     STATE   PORT   CPU   MEM       URL
  api      ready   20570  0.0%  79.9 MiB  https://api.example-ci-with.localhost
  web      ready   20571  0.0%  85.3 MiB  https://example-ci-with.localhost
  build    exited  –      –     –
  install  exited  –      –     –
  smoke    exited  –      –     –
```

In devlanes 0.11.3, `exec` units do not get `NODE_EXTRA_CA_CERTS`, so the same command without `--use-system-ca` fails with `self-signed certificate in certificate chain` and `smoke` shows as `failed`. `--use-system-ca` makes Node read the CA that `devlanes setup` added to the system store, and `--import tsx` runs the TypeScript file. `devlanes wait smoke` reports a failed `exec` unit with its log tail and exits 1, but counts a running one as ready, so read the result from `devlanes status` or `devlanes logs`.

## Try next

- Run `with` while `devlanes start` has the lane running. `with` keeps the running `dev` units and starts nothing, so the profile check fails and the lane stays up:

  ```text
  example-ci-with@0 (main): 2/2 ready, already running (nothing started)
  ...
  ✖ api runs the e2e profile's start script with NODE_ENV=test (2.2683ms)
  ```

  The assertion reads `'dev' !== 'start'`. Run `devlanes stop` first.

- Run the tests against a second lane. With a worktree: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/workflows-ci-with && devlanes with --profile e2e -- npm test` (not run for this example; the worktree is a lane of its own). Without one, in this folder:

  ```sh
  devlanes lane new --name example-ci-with-review --start
  devlanes stop --lane example-ci-with-review
  devlanes with --lane example-ci-with-review --profile e2e -- npm test
  ```

  The same tests pass against https://api.example-ci-with1.localhost and https://example-ci-with1.localhost, and the run ends with `devlanes with · example-ci-with@1 · exit 0`.

- Remove the lanes with `devlanes lane clean example-ci-with-review --yes` and `devlanes lane clean 0 --yes`.

## Files

- `devlanes.yaml`: `api` and `web` with their hostnames and `/healthz` checks, the `install` and `build` tasks, and the `e2e` profile with `run_scripts` and `NODE_ENV`.
- `tests/lane.test.ts`: the `node:test` tests `npm test` runs through tsx.
- `tests/smoke.ts`: the `/healthz` check for `devlanes exec`.
- `github-workflow.yml`: the GitHub Actions workflow on `devlanes-run/action`.
- `apps/api/src/app.ts`: the API's routes (`/`, `/api/items`, `/lane`, `/healthz`) and CORS from `DEVLANES_ORIGINS`.
- `apps/web/src/views/`: the page as JSX components; `apps/web/src/client/main.ts` is the browser code that fetches the API.
- `apps/*/src/env.ts`: every variable each service reads; `apps/*/package.json` has the `dev` and `start` scripts.
- `apps/web/brand`: a link to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [Service patterns: agents and CI](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#agents-and-ci)
- [CLI reference: devlanes with](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/cli.md#devlanes-with)
- [Config reference: profiles](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#profiles)
- [Config reference: tasks](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#tasks)
- [Ports and environment: devlanes variables](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#devlanes-variables)
- [devlanes-run/action](https://github.com/devlanes-run/action)
