# Services built to fail

One Node file runs every service of this project in a different mode, and all but one are broken on purpose: a crash on boot, a crash on request, a missing program, a wrong port, a ready check that never passes and a proxy loop. Each one, started by name, shows what devlanes prints in `devlanes start`, `devlanes debug why` and the proxy's error pages (DL101 to DL303). A `default` profile keeps a plain `devlanes start` healthy, and `devlanes.broken.yaml` holds a config typo for `devlanes config check`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (tested with Node 24)

## Run it

```sh
cd showcase-broken
devlanes start
```

Open https://broken.localhost. The page shows lane 0 of `broken` and lists every broken service with its hostname, the error it causes and the command that starts it.

## During a start

The `default` profile names only `index`, so a plain start runs that one service and waits for `/healthz`. The other services have hostnames from the start: until one is started, its hostname answers DL201. Every broken service extends the `broken` template, so `+broken` selects them all.

A plain `devlanes start` brings back what the lane ran before, broken services included. `devlanes stop` without names forgets them, and the next plain start runs only `index` again.

## Try next

The output below was captured without a terminal (`--output plain`) and trimmed. On a terminal, `devlanes start` runs in the TUI unless you pass `--no-ui`. On Windows, add `--ssl-revoke-best-effort` to the `curl` commands.

### Crash on boot

`crash` prints a message and exits 1 before it listens:

```sh
devlanes start crash --no-ui
```

```text
broken@0 · main
failed services  0 of 1 ready
  failed  crash  exited 1   crash: ACME_API_KEY is not set, refusing to boot

logs: devlanes logs broken@0:crash --tail 200
```

The unit stays failed. devlanes does not restart it, and `devlanes status` still shows `failed (1)` later. `devlanes debug errors` lists it with its crash count, and `devlanes debug why crash` gives the reason:

```text
failed broken@0:crash
  exited with code 1 (devlanes logs broken@0:crash --tail 200)
  not selected by profile default (devlanes start broken@0:crash)
```

`curl https://crash.broken.localhost/` gets the DL203 page with the end of the output:

````text
# DL203 Service failed

`service-failed`, 503 Service Unavailable, error. Sent by the devlanes 0.11.3 proxy, not by the service.

The service exited or its ready check failed.

Recent output:

```
crash: ACME_API_KEY is not set, refusing to boot
```

## Diagnose

- Show the cause and a fix: `devlanes debug why broken@0:crash`
- Read its output since the last start: `devlanes logs broken@0:crash --since start`
- Restart it: `devlanes restart broken@0:crash`
````

### Crash on request

`fragile` starts healthy. `/crash` answers, then throws a second later:

```sh
devlanes start fragile --no-ui
curl https://fragile.broken.localhost/crash
curl https://fragile.broken.localhost/
```

```text
fragile exits in 1 second
```

The second request gets DL203 with the stack trace under "Recent output", ending in `Error: crash requested through /crash`, and `devlanes status` shows `fragile failed (1)`.

### Reset and 101

`devlanes restart fragile --no-ui` brings it back. `/reset` destroys the socket without an answer:

```sh
curl https://fragile.broken.localhost/reset
```

```text
# DL302 Upstream request failed

`upstream-failed`, 502 Bad Gateway, error. Sent by the devlanes 0.11.3 proxy, not by the service.

The service closed the connection or sent an invalid HTTP/1.1 response.
```

`/upgrade` answers a plain GET with `101 Switching Protocols`:

```sh
curl https://fragile.broken.localhost/upgrade
```

```text
# DL303 Unexpected protocol upgrade

`unexpected-upgrade`, 502 Bad Gateway, error. Sent by the devlanes 0.11.3 proxy, not by the service.

The service answered 101 Switching Protocols to a request that did not ask for an upgrade.
```

Both leave the process running.

### Stopped service

```sh
devlanes stop fragile
curl https://fragile.broken.localhost/
```

```text
# DL201 Service not running

`service-idle`, 503 Service Unavailable, info. Sent by the devlanes 0.11.3 proxy, not by the service.

The service behind this hostname is stopped.

## Diagnose

- Start the whole lane: `devlanes start --lane broken@0`
- Start the service: `devlanes start broken@0:fragile`
- Show why it is not running: `devlanes debug why broken@0:fragile`
```

A service that was never started gets the same page.

### Missing program

`missing` runs `acme-dev-server`, which is not installed. Its `run` is a list, so no shell is involved and devlanes reports the spawn failure itself:

```sh
devlanes start missing --no-ui
```

```text
broken@0 · main
  failed  missing  couldn't start: acme-dev-server: command not found on PATH

hint: check the lane's PATH: devlanes env show missing --lane broken@0
```

`devlanes logs missing` has the same line with the PATH that was searched. The process never ran, so `devlanes status` lists `missing` as `idle` and its hostname answers DL201.

### Wrong port

`wrongport` ignores `PORT` and lets the OS pick a port. With `ready: started` the start passes anyway:

```sh
devlanes start wrongport --no-ui
curl https://wrongport.broken.localhost/
```

```text
# DL301 Service not listening

`upstream-unreachable`, 503 Service Unavailable, error. Sent by the devlanes 0.11.3 proxy, not by the service.

devlanes has the service as running, but nothing accepted connections on its port while the proxy retried.
```

The page took about 8 seconds of retries. `devlanes debug why wrongport` finds nothing wrong (`no blocking reason found`), since the unit is ready. Comparing `devlanes url ls` with `devlanes logs wrongport` shows the mistake:

```text
wrongport.broken.localhost                ->  broken@0:wrongport             20446  ready
wrongport#1 wrongport listening on http://127.0.0.1:58077
```

### Ready check that never passes

`neverready` listens on `PORT`, but its `/healthz` answers 503. Its ready timeout is 45 seconds, longer than the 30 seconds the proxy holds a request. Start it with a short `--timeout` so the command returns while the service is still starting:

```sh
devlanes start neverready --no-ui --timeout 5s
curl https://neverready.broken.localhost/
```

```text
broken@0 · main
failed services  0 of 1 ready
  starting  neverready
timed out before every unit was ready
```

`curl` waits 30 seconds, then gets:

```text
# DL202 Service starting

`service-starting`, 503 Service Unavailable, warning. Sent by the devlanes 0.11.3 proxy, not by the service.

The proxy held the request while the service started, but its ready check did not pass in time. Reload when it is ready.
```

`devlanes wait neverready` exits 1 when the 45 seconds run out:

```text
failed broken@0:neverready
  wasn't ready in time; GET /healthz (Host: 127.0.0.1:20445) answered 503
  | neverready listening on http://127.0.0.1:20445
  more: devlanes logs broken@0:neverready --tail 200
```

From then on the hostname answers DL203. The process keeps running, and `devlanes debug why neverready` suggests a fix:

```text
failed broken@0:neverready
  did not become ready before the timeout; GET /healthz (Host: 127.0.0.1:20445) answered 503 (use a `ready.http.path` that answers 2xx, set `ready.http.host` if the app routes by hostname, or set `ready.http.status: 503`)
```

### Proxy loop

`loop` forwards each request to its own `public_url` and keeps the `Host` header, as a dev server proxy without `changeOrigin` does:

```sh
devlanes start loop --no-ui
curl https://loop.broken.localhost/
```

```text
# DL104 Proxy loop

`proxy-loop`, 508 Loop Detected, error. Sent by the devlanes 0.11.3 proxy, not by the service.

This request already passed through this route. A dev server proxy probably sent it back to devlanes with the original Host header.
```

### Unknown hostname

The proxy has no certificate for an unknown hostname, so HTTPS fails in the TLS handshake (curl exit 35 on Windows). Use `http://`:

```sh
curl http://nothing.broken.localhost/
```

```text
# DL101 Unknown host

`unknown-host`, 404 Not Found, error. Sent by the devlanes 0.11.3 proxy, not by the service.

No lane routes this hostname. While the daemon runs, it answers every request to this machine's HTTP and HTTPS ports, including requests meant for other servers.

Did you mean `missing.broken.localhost` (broken@0)?
```

The page then lists the hostnames this machine routes.

### Config typo

`devlanes.broken.yaml` is a second project file with `hots` instead of `hosts`:

```sh
devlanes --file devlanes.broken.yaml config check
```

```text
error: ...\showcase-broken\devlanes.broken.yaml is invalid at line 8, column 11: services.web.hots: unknown key `hots`; did you mean `hosts`?
hint: edit ...\showcase-broken\devlanes.broken.yaml at line 8, then run this again
```

The check exits 1 and does not register the file's project: `devlanes lane ls -p broken-config` answers `error: broken-config not found` afterwards.

### A second lane

`devlanes lane new --name review --start --no-ui` adds lane 1 in this folder. https://broken1.localhost shows `This is lane 1 of broken.`, and `devlanes --lane review start crash --no-ui` fails only lane 1's `crash`, whose page names `broken@1:crash`.

`devlanes lane clean review --yes` and `devlanes lane clean 0 --yes` remove both lanes.

## Files

- `devlanes.yaml`: the healthy `index`, the `broken` template, one service per failure and the `default` profile.
- `devlanes.broken.yaml`: a project file with a typo, for `config check`.
- `server.mjs`: every service, picked by `MODE`; the index page lists the failures.
- `package.json`: no dependencies; it makes devlanes detect Node and give the services the devlanes CA.
- `devlanes.css`, `logo.svg`: the page's look, from `_template`.

## Docs

- [Proxy errors](https://github.com/devlanes-run/devlanes/blob/main/docs/errors/README.md)
- [Lane lifecycle](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md)
- [Config reference: `ready`](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#services)
- [Getting started: troubleshooting](https://github.com/devlanes-run/devlanes/blob/main/docs/getting-started.md#troubleshooting)
