# Services built to fail

One TypeScript server runs every service of this project in a different `MODE`, and all but one are broken on purpose: a crash on boot, a crash on request, a reset connection, a stray 101 answer, a missing program, a wrong port, a ready check that never passes and a proxy loop. Each one, started by name, shows what devlanes prints in `devlanes start`, `devlanes debug why` and the proxy's error pages (DL101 to DL303). A `default` profile keeps a plain `devlanes start` healthy, and `devlanes.broken.yaml` holds a config typo for `devlanes config check`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (tested with Node 24 and npm 11)

## Run it

```sh
cd showcase-broken
devlanes start
```

On a terminal, `devlanes start` opens the TUI. With `--no-ui --output plain` it prints:

```text
ok install
example-broken@0 · main
ok services  1 of 1 ready
  ok  index  https://example-broken.localhost
```

Open https://example-broken.localhost. The page says `This is lane 0 of example-broken.` and lists every broken service with the error it causes, its hostname and the command that starts it.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0.

1. The first start of a lane runs the `install` task (`npm install`).
2. The `default` profile names only `index`, so a plain start runs that one service (`npm run dev`, which is `tsx watch src/index.ts` with `MODE=index`) and waits for `/healthz`.
3. The other services have hostnames from the start: until one is started, its hostname answers DL201.

Every broken service extends the `broken` template, which runs `npm run serve` (`tsx src/index.ts` without watch, so a crash ends the process) and tags it `broken`, so `+broken` selects them all. `src/index.ts` reads `MODE` and runs the matching module from `src/modes/`.

A plain `devlanes start` brings back what the lane ran before, broken services included. `devlanes stop` without names forgets them, and the next plain start runs only `index` again.

## Try next

The output below was captured with `--output plain` and trimmed. On Windows, add `--ssl-revoke-best-effort` to the `curl` commands.

### Crash on boot

`crash-on-boot` prints a message and exits 1 before it listens:

```sh
devlanes start crash-on-boot --no-ui
```

```text
example-broken@0 · main
failed services  0 of 1 ready
  failed  crash-on-boot  exited 1   crash-on-boot: ACME_API_KEY is not set, refusing to boot

logs: devlanes logs example-broken@0:crash-on-boot --tail 200
```

The unit stays failed. devlanes does not restart it, and `devlanes status` still shows `failed=crash-on-boot` later. `devlanes debug errors` lists it with its crash count, and `devlanes debug why crash-on-boot` gives the reason:

```text
failed example-broken@0:crash-on-boot
  exited with code 1 (devlanes logs example-broken@0:crash-on-boot --tail 200)
  not selected by profile default (devlanes start example-broken@0:crash-on-boot)
```

`curl https://crash-on-boot.example-broken.localhost/` gets the DL203 page with the end of the output:

````text
# DL203 Service failed

`service-failed`, 503 Service Unavailable, error. Sent by the devlanes 0.11.3 proxy, not by the service.

The service exited or its ready check failed.

Recent output:

```

> serve
> tsx src/index.ts

crash-on-boot: ACME_API_KEY is not set, refusing to boot
```

## Diagnose

- Show the cause and a fix: `devlanes debug why example-broken@0:crash-on-boot`
- Read its output since the last start: `devlanes logs example-broken@0:crash-on-boot --since start`
- Restart it: `devlanes restart example-broken@0:crash-on-boot`
````

### Crash on request

`crash-route` starts healthy. `/crash` answers, then throws a second later:

```sh
devlanes start crash-route --no-ui
curl https://crash-route.example-broken.localhost/crash
curl https://crash-route.example-broken.localhost/
```

```text
crash-route exits in 1 second
```

The second request gets DL203 with the stack trace under "Recent output", ending in `Error: crash requested through /crash` and `Node.js v24.16.0`, and `devlanes status` shows `failed=crash-route`. `devlanes restart crash-route --no-ui` brings it back.

### Reset and 101

`reset` closes the connection to `/` without an answer, and `upgrade` answers a plain GET with `101 Switching Protocols`. Both pass their ready check, since `/healthz` behaves:

```sh
devlanes start reset upgrade --no-ui
curl https://reset.example-broken.localhost/
curl https://upgrade.example-broken.localhost/
```

```text
# DL302 Upstream request failed

`upstream-failed`, 502 Bad Gateway, error. Sent by the devlanes 0.11.3 proxy, not by the service.

The service closed the connection or sent an invalid HTTP/1.1 response.
```

```text
# DL303 Unexpected protocol upgrade

`unexpected-upgrade`, 502 Bad Gateway, error. Sent by the devlanes 0.11.3 proxy, not by the service.

The service answered 101 Switching Protocols to a request that did not ask for an upgrade.
```

Both processes keep running, and `devlanes logs reset` shows `/: destroying the socket without an answer`.

### Stopped service

```sh
devlanes stop reset
curl https://reset.example-broken.localhost/
```

```text
# DL201 Service not running

`service-idle`, 503 Service Unavailable, info. Sent by the devlanes 0.11.3 proxy, not by the service.

The service behind this hostname is stopped.

## Diagnose

- Start the whole lane: `devlanes start --lane example-broken@0`
- Start the service: `devlanes start example-broken@0:reset`
- Show why it is not running: `devlanes debug why example-broken@0:reset`
```

A service that was never started gets the same page. A failed one keeps its DL203 page: `devlanes stop crash-route` answers `nothing was running`.

### Missing program

`missing-program` runs `acme-dev-server`, which is not installed. Its `run` is a list, so no shell is involved and devlanes reports the spawn failure itself:

```sh
devlanes start missing-program --no-ui
```

```text
example-broken@0 · main
  failed  missing-program  couldn't start: acme-dev-server: command not found on PATH

hint: check the lane's PATH: devlanes env show missing-program --lane example-broken@0
```

`devlanes logs missing-program` has the same line with the PATH that was searched. The process never ran, so `devlanes status` lists `missing-program` as `idle` and its hostname answers DL201.

### Wrong port

`wrong-port` ignores `PORT` and lets the OS pick a port. With `ready: started` the start passes anyway:

```sh
devlanes start wrong-port --no-ui
curl https://wrong-port.example-broken.localhost/
```

```text
# DL301 Service not listening

`upstream-unreachable`, 503 Service Unavailable, error. Sent by the devlanes 0.11.3 proxy, not by the service.

devlanes has the service as running, but nothing accepted connections on its port while the proxy retried.
```

The page took about 8 seconds of retries. `devlanes debug why wrong-port` finds nothing wrong (`no blocking reason found`), since the unit is ready. Comparing `devlanes url ls` with `devlanes logs wrong-port` shows the mistake:

```text
ready wrong-port.example-broken.localhost -> example-broken@0:wrong-port port=20618
wrong-port#5 wrong-port listening on http://127.0.0.1:58106
```

### Ready check that never passes

`never-ready` listens on `PORT`, but its `/healthz` answers 503. Its ready timeout is 45 seconds, longer than the 30 seconds the proxy holds a request. Start it with a short `--timeout` so the command returns while the service is still starting:

```sh
devlanes start never-ready --no-ui --timeout 5s
curl https://never-ready.example-broken.localhost/
```

```text
example-broken@0 · main
failed services  0 of 1 ready
  starting  never-ready
timed out before every unit was ready
```

`curl` waits 30 seconds, then gets:

```text
# DL202 Service starting

`service-starting`, 503 Service Unavailable, warning. Sent by the devlanes 0.11.3 proxy, not by the service.

The proxy held the request while the service started, but its ready check did not pass in time. Reload when it is ready.
```

`devlanes wait never-ready` exits 1 when the 45 seconds run out:

```text
failed example-broken@0:never-ready
  wasn't ready in time; GET /healthz (Host: 127.0.0.1:20614) answered 503
  | never-ready listening on http://127.0.0.1:20614
  more: devlanes logs example-broken@0:never-ready --tail 200
```

From then on the hostname answers DL203. The process keeps running, and `devlanes debug why never-ready` suggests a fix:

```text
failed example-broken@0:never-ready
  did not become ready before the timeout; GET /healthz (Host: 127.0.0.1:20614) answered 503 (use a `ready.http.path` that answers 2xx, set `ready.http.host` if the app routes by hostname, or set `ready.http.status: 503`)
```

### Proxy loop

`proxy-loop` forwards each request to its own `public_url` and keeps the `Host` header, as a dev server proxy without `changeOrigin` does:

```sh
devlanes start proxy-loop --no-ui
curl https://proxy-loop.example-broken.localhost/
```

```text
# DL104 Proxy loop

`proxy-loop`, 508 Loop Detected, error. Sent by the devlanes 0.11.3 proxy, not by the service.

This request already passed through this route. A dev server proxy probably sent it back to devlanes with the original Host header.
```

### Unknown hostname

The proxy has no certificate for an unknown hostname, so HTTPS fails in the TLS handshake (curl exit 35 on Windows). Use `http://`:

```sh
curl http://nothing.example-broken.localhost/
```

```text
# DL101 Unknown host

`unknown-host`, 404 Not Found, error. Sent by the devlanes 0.11.3 proxy, not by the service.

No lane routes this hostname. While the daemon runs, it answers every request to this machine's HTTP and HTTPS ports, including requests meant for other servers.

Did you mean `reset.example-broken.localhost` (example-broken@0)?
```

The page then lists the hostnames this machine routes.

### Config typo

`devlanes.broken.yaml` is a second project file with `hots` instead of `hosts`:

```sh
devlanes --file devlanes.broken.yaml config check
```

```text
error: ...\showcase-broken\devlanes.broken.yaml is invalid at line 10, column 11: services.web.hots: unknown key `hots`; did you mean `hosts`?
hint: edit ...\showcase-broken\devlanes.broken.yaml at line 10, then run this again
```

The check exits 1 and does not register the file's project: `devlanes lane ls -p example-broken-config` answers `error: example-broken-config not found` afterwards.

### A second lane

`git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/showcase-broken && devlanes start`. The new worktree is lane 1, and https://example-broken1.localhost says `This is lane 1 of example-broken.` with another lane colour. `devlanes start crash-on-boot --no-ui` there fails only lane 1's `crash-on-boot`, whose page names `example-broken@1:crash-on-boot`, while lane 0 keeps running.

That worktree step was not run for this README. To get lane 1 without a worktree, run `devlanes lane new --name example-broken-review --start --no-ui` in this folder and use `devlanes --lane example-broken-review start crash-on-boot --no-ui`; the results above came from that.

When you are done, `devlanes lane clean 0 --yes` removes lane 0. Run it with `1` for the second lane.

## Files

- `devlanes.yaml`: the healthy `index`, the `broken` template, one service per failure and the `default` profile.
- `devlanes.broken.yaml`: a project file with a typo, for `config check`.
- `src/index.ts`: reads `MODE` and runs one module from `src/modes/`.
- `src/modes/`: one small module per mode. `reset.ts` and `upgrade.ts` write to the raw socket, and `proxy-loop.ts` forwards with `node:https`.
- `src/failures.ts`: the table the index page lists; `src/views/` renders it.
- `src/env.ts`: every variable the server reads, parsed once.
- `brand`: a link to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [Proxy errors](https://github.com/devlanes-run/devlanes/blob/main/docs/errors/README.md)
- [Lane lifecycle](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md)
- [Config reference: `ready`](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#services)
- [Getting started: troubleshooting](https://github.com/devlanes-run/devlanes/blob/main/docs/getting-started.md#troubleshooting)
