# Run tests against a lane with devlanes with

A Node API and a page that calls it, plus `node:test` tests that call both over HTTPS. `devlanes with --profile e2e -- npm test` starts the lane, runs the tests with `DEVLANES_PUBLIC_URL_API` and `DEVLANES_PUBLIC_URL_WEB` set, stops the lane and exits with the tests' code. The `e2e` profile swaps each service's `dev` script for `start` with `run_scripts` and sets `NODE_ENV: test`. `github-workflow.yml` runs the same thing in GitHub Actions with [devlanes-run/action](https://github.com/devlanes-run/action).

## Requirements

- devlanes 0.11.3 or newer, with `devlanes setup` run once
- Node 22 or newer with npm (tested with Node 24 and npm 11). Nothing to install: the app and the tests use only Node's standard library.

## Run it

```sh
cd workflows-ci-with
devlanes with --profile e2e --logs-dir devlanes-logs -- npm test
```

```text
ci-with@0 (main): 2/2 ready
ready api http://127.0.0.1:20490 https://api.ci-with.localhost
ready web http://127.0.0.1:20491 https://ci-with.localhost

> ci-with@0.0.0 test
> node --test test/*.test.mjs

✔ devlanes with sets the lane's public URLs (0.5815ms)
✔ api answers /lane for this lane through the proxy (39.8517ms)
✔ web answers /lane for this lane through the proxy (4.8974ms)
✔ api runs the e2e profile's start script with NODE_ENV=test (1.2283ms)
✔ api allows the web origin of this lane (4.8452ms)
✔ api sends no CORS header to another origin (1.3885ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 149.6921
devlanes with · ci-with@0 · exit 0
UNIT  STATE  RUN TIME  AVG CPU  PEAK CPU   AVG MEM  PEAK MEM
api   ready        1s     0.0%      0.0%  48.0 MiB  48.0 MiB
web   ready        1s     0.0%      0.0%  48.3 MiB  48.3 MiB
```

The exit code is 0. Each Git worktree of this repository is a lane with its own ports and hostnames, and the primary worktree is lane 0. The table at the end appears when the output is not a terminal, as in CI logs; in GitHub Actions devlanes also adds it to the step summary.

To open the page instead, run `devlanes start` and open https://ci-with.localhost. It shows lane 0 of `ci-with`, the `npm run dev` script and the answer the browser fetched from https://api.ci-with.localhost.

## During a with run

1. devlanes starts the services the `e2e` profile includes (`"*"`, so both). `run_scripts: { dev: start }` makes `api` and `web` run `npm run start` (`node server.mjs`) instead of `npm run dev` (`node --watch server.mjs`), and the profile's `env` gives both `NODE_ENV=test`.
2. It waits until both `/healthz` checks pass. If a service fails, `with` prints the failure and exits 1 without running the tests.
3. It runs `npm test` with the lane's environment: `DEVLANES_PUBLIC_URL_API=https://api.ci-with.localhost`, `DEVLANES_PUBLIC_URL_WEB=https://ci-with.localhost`, `DEVLANES_LANE` and the other lane variables, and `NODE_EXTRA_CA_CERTS` pointing at the devlanes CA, so `fetch` trusts the proxy's certificates. Services do not get the `DEVLANES_PUBLIC_URL_*` variables; `web` reads the API's address from `API_URL: ${{ services.api.public_url }}`.
4. It writes each unit's log to `devlanes-logs/`, stops what it started and exits with `npm test`'s code.

The tests in `test/lane.test.mjs` never name a hostname. They check that each service's `/lane` answers for this lane through the proxy, that the API ran the `start` script with `NODE_ENV=test` (npm puts the script name in `npm_lifecycle_event`), and that the API sends `Access-Control-Allow-Origin` to the page's origin and not to `https://example.invalid`. The API builds that allow-list from `DEVLANES_ORIGINS`.

## A failing run

Start only `api` and the `web` test fails, so `with` exits 1:

```sh
devlanes with --profile e2e api --logs-dir devlanes-logs -- npm test
```

```text
ci-with@0 (main): 1/1 ready
ready api http://127.0.0.1:20490 https://api.ci-with.localhost

> ci-with@0.0.0 test
> node --test test/*.test.mjs

✔ devlanes with sets the lane's public URLs (0.5391ms)
✔ api answers /lane for this lane through the proxy (42.2132ms)
✖ web answers /lane for this lane through the proxy (5.5419ms)
✔ api runs the e2e profile's start script with NODE_ENV=test (2.6759ms)
✔ api allows the web origin of this lane (5.424ms)
✔ api sends no CORS header to another origin (2.1417ms)
ℹ tests 6
ℹ suites 0
ℹ pass 5
ℹ fail 1
...
✖ web answers /lane for this lane through the proxy (5.5419ms)
  AssertionError [ERR_ASSERTION]: https://ci-with.localhost/lane answered 503
...
devlanes with · ci-with@0 · exit 1
UNIT  STATE  RUN TIME  AVG CPU  PEAK CPU   AVG MEM  PEAK MEM
api   ready        1s     0.0%      0.0%  47.9 MiB  47.9 MiB
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

> ci-with-api@0.0.0 start
> node server.mjs

api listening on http://127.0.0.1:20490
```

devlanes does not empty the folder first. After the failing run above, `unit-api.log` was new and `unit-web.log` was still the one from the run before, so delete the folder between local runs when you read it. A CI job starts from a clean checkout.

## GitHub Actions

`github-workflow.yml` is a workflow to copy into `.github/workflows/`. The examples repository's own CI does not run it, and it has not been run for this example. It checks out the repository, sets up Node 24 and runs `devlanes-run/action@v0` with `command: with`, `profile: e2e` and `run: npm test`. `working-directory: workflows-ci-with` points the action at this folder's `devlanes.yaml`; use `.` when the file is at the repository root. The step fails when the tests fail, and the action then uploads the unit logs, the daemon's log and the output of `devlanes doctor` as an artifact. On Linux runners the action trusts the devlanes CA and lets the proxy use port 443, so the URLs match the ones above.

## Ad-hoc checks with exec

Against a lane that is already running, an agent or a script runs a one-off command as a unit of the lane with `devlanes exec`. The command gets the `DEVLANES_PUBLIC_URL_*` variables, and `devlanes logs` and `devlanes status` show its output and exit code:

```sh
devlanes start --no-ui
devlanes wait web --timeout 2m
devlanes exec --name smoke -- node --use-system-ca test/smoke.mjs
devlanes logs smoke
devlanes status
```

```text
ci-with@0 (main): 2/2 ready
ready api http://127.0.0.1:20490 https://api.ci-with.localhost
ready web http://127.0.0.1:20491 https://ci-with.localhost
ready ci-with@0:web
ready ci-with@0:smoke actor=opencode pid=73140
  logs: devlanes logs ci-with@0:smoke -f
  stop: devlanes stop ci-with@0:smoke
smoke#1 api https://api.ci-with.localhost/healthz 200 ok
smoke#2 web https://ci-with.localhost/healthz 200 ok
running ci-with@0 main 2/2
ready ci-with@0:api http://127.0.0.1:20490 https://api.ci-with.localhost default=20490 actor=opencode
ready ci-with@0:web http://127.0.0.1:20491 https://ci-with.localhost default=20491 actor=opencode
exited ci-with@0:smoke exit=0 actor=opencode
```

In devlanes 0.11.3, `exec` units do not get `NODE_EXTRA_CA_CERTS`, so plain `node test/smoke.mjs` fails with `self-signed certificate in certificate chain`. `--use-system-ca` makes Node read the CA that `devlanes setup` added to the system store. `devlanes wait smoke` reports a failed `exec` unit with its log tail and exits 1, but counts a running one as ready, so read the result from `devlanes status` or `devlanes logs`.

## Try next

- Run `with` while `devlanes start` has the lane running. `with` keeps the running `dev` units and starts nothing, so the profile check fails and the lane stays up:

  ```text
  ci-with@0 (main): 2/2 ready, already running (nothing started)
  ...
  ✖ api runs the e2e profile's start script with NODE_ENV=test (1.7923ms)
  ```

  The assertion reads `'dev' !== 'start'`. Run `devlanes stop` first.
- Run the tests against a second lane. With a worktree: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/workflows-ci-with && devlanes with --profile e2e -- npm test` (not run for this example; the worktree is a lane of its own). Without one, in this folder:

  ```sh
  devlanes lane new --name ci-with-review --start
  devlanes stop --lane ci-with-review
  devlanes with --lane ci-with-review --profile e2e -- npm test
  ```

  The same tests pass against https://api.ci-with1.localhost and https://ci-with1.localhost, and the run ends with `devlanes with · ci-with@1 · exit 0`.
- Remove the lanes with `devlanes lane clean ci-with-review --yes` and `devlanes lane clean 0 --yes`.

## Files

- `devlanes.yaml`: `api` and `web` with their hostnames and `/healthz` checks, and the `e2e` profile with `run_scripts` and `NODE_ENV`.
- `test/lane.test.mjs`: the `node:test` tests `npm test` runs.
- `test/smoke.mjs`: the `/healthz` check for `devlanes exec`.
- `github-workflow.yml`: the GitHub Actions workflow on `devlanes-run/action`.
- `api/server.mjs`: the API on `node:http`, with CORS from `DEVLANES_ORIGINS`, `/`, `/api/items`, `/lane` and `/healthz`.
- `web/server.mjs`: the page, `/lane` and `/healthz`.
- `api/package.json`, `web/package.json`: the `dev` and `start` scripts.
- `web/public/devlanes.css` and `web/public/logo.svg`: the devlanes look, copied from `_template`.

## Docs

- [Service patterns: agents and CI](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#agents-and-ci)
- [CLI reference: devlanes with](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/cli.md#devlanes-with)
- [Config reference: profiles](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#profiles)
- [Ports and environment: devlanes variables](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#devlanes-variables)
- [devlanes-run/action](https://github.com/devlanes-run/action)
