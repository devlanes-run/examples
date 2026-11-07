# Ready checks

Eight copies of one Node server, each with another kind of `ready` check: `ready.http`, `ready.tcp`, `ready.log`, `ready.http.host` and `ready.cmd` for an app that answers only on its own hostname, and `host_header: upstream` for an app that answers only on `127.0.0.1:<port>`. `server.mjs` has no dependencies and every service runs it, so `devlanes.yaml` is the file to read.

## Requirements

- devlanes, with `devlanes setup` run once
- Node and npm (tested with Node 24 and npm 11)
- curl on `PATH`, for the `ready.cmd` check of `own-host-cmd`

## Run it

```sh
cd basics-ready-checks
devlanes start
```

Open https://ready-checks.localhost. The page shows lane 0 of `ready-checks` (the lane of this worktree) and links to every service with the check it uses. Each service's page shows the `Host` header the app received: `own-host.ready-checks.localhost` on own-host, `127.0.0.1:<port>` on legacy-host.

## During a start

devlanes starts every service with `npm run dev` from `package.json` (the `node` template) and waits for each one's check:

- `index` at `ready-checks.localhost`: `ready.http` on `/healthz`. Its links come from `services.<name>.public_url`.
- `http-check`: `GET /healthz` on its port must answer 2xx within 15 s.
- `tcp-check`: ready as soon as its port accepts a connection, whatever the app would answer.
- `log-check`: waits 3 s (`START_DELAY_MS`), listens and prints `listening on http://127.0.0.1:<port>`, which `ready.log` matches.
- `own-host`: answers 400 to any `Host` but `own-host.ready-checks.localhost` (`ALLOWED_HOST`), the way Django's `ALLOWED_HOSTS` does. The check sends `Host: 127.0.0.1:<port>` by default, so `ready.http.host` sends `${{ self.hosts[0] }}` instead.
- `own-host-cmd`: the same app, checked by `ready.cmd` with `curl -fsS -H "Host: ..." http://127.0.0.1:<port>/healthz`.
- `legacy-host`: answers 400 to any `Host` but `127.0.0.1:<port>`. `host_header: upstream` makes the proxy send that address instead of the hostname, and the check sends it by default.
- `slow-start`: sleeps 8 s before it listens, so it shows `starting` in `devlanes status` until then.

`devlanes start --no-ui` returns once all eight are ready, about 9 seconds here:

```text
ready-checks@0 · main
✓ services  8 of 8 ready
  ✓  index         https://ready-checks.localhost
  ✓  http-check    https://http-check.ready-checks.localhost
  ✓  tcp-check     https://tcp-check.ready-checks.localhost
  ✓  log-check     https://log-check.ready-checks.localhost
  ✓  own-host      https://own-host.ready-checks.localhost
  ✓  own-host-cmd  https://own-host-cmd.ready-checks.localhost
  ✓  legacy-host   https://legacy-host.ready-checks.localhost
  ✓  slow-start    https://slow-start.ready-checks.localhost
```

The lane card on each page reads `DEVLANES_LANE`, `DEVLANES_LANE_NAME`, `LANE_LABEL`, `DEVLANES_SERVICE`, `PORT` and the `X-Forwarded-Host` header the proxy adds. `/lane` returns the same values as JSON and `/healthz` answers `ok`.

## Try next

On Windows, add `--ssl-revoke-best-effort` to the `curl` commands.

- Start a second lane: `devlanes lane new --name review --start` adds lane 1 to this folder at https://ready-checks1.localhost, with `http-check.ready-checks1.localhost` and the rest. `curl https://ready-checks1.localhost/lane` answers `"lane":1`, and `devlanes status` lists both lanes.
- Catch a service while it starts: `devlanes restart slow-start --no-ui --timeout 2s` stops waiting after 2 seconds and exits 124:

  ```text
  ready-checks@0 · main
  ✗ services  0 of 1 ready
    starting  slow-start
  ! timed out before every unit was ready
  ```

  Right after, `devlanes debug why slow-start` prints `starting; waiting for its readiness check (devlanes wait ready-checks@0:slow-start)`, and `devlanes wait slow-start` returns `ready ready-checks@0:slow-start` once the server listens.
- Break a check: change http-check's `path: /healthz` to `path: /missing` in `devlanes.yaml` and run `devlanes reload --no-ui`. After the 15 s timeout it exits 1:

  ```text
  ready-checks@0 · main
  ✗ services  0 of 1 ready
    ✗  http-check  wasn't ready in time; GET /missing (Host: 127.0.0.1:20520) answered 404   listening on http://127.0.0.1:20520

  hint: use a `ready.http.path` that answers 2xx, set `ready.http.host` if the app routes by hostname, or set `ready.http.status: 404`
  ```

  The process keeps running, but https://http-check.ready-checks.localhost now gets the proxy's `DL203 Service failed` page, and `devlanes debug why http-check` prints the same reason. Put `/healthz` back and `devlanes reload --no-ui` brings it back to ready.
- Drop the Host rewrite: delete `host_header: upstream` from legacy-host and save. The proxy applies the route change by itself (`devlanes reload` reports `nothing to reload`), and `curl https://legacy-host.ready-checks.localhost/` answers `invalid host legacy-host.ready-checks.localhost: this app answers only on 127.0.0.1:<port>`. Put the line back.
- Clean up: `devlanes lane clean review --yes` and `devlanes lane clean 0 --yes` stop both lanes and delete their data and logs.

## Files

- `devlanes.yaml`: the eight services and their ready checks, with a comment wherever a key is the point.
- `server.mjs`: the server every service runs. `START_DELAY_MS` delays its listen and `ALLOWED_HOST` makes it refuse other `Host` headers.
- `package.json`: the `dev` script that `run_script` runs, and `packageManager`.
- `devlanes.css` and `logo.svg`: the page style, served by `server.mjs`.

## Docs

- [Service patterns: frontend and API](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#frontend-and-api), on the `http` check, its `host` and `User-Agent: devlanes-ready`
- [Config reference: services](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#services), every `ready` and `hosts` key
- [Lane lifecycle: editing the project file](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#editing-the-project-file), on `devlanes reload`
