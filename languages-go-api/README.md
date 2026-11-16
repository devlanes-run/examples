# Go and net/http

Two Go programs in one module, written with the standard library. devlanes runs `api` from `go.mod` and `web` through a Taskfile task that runs air, which rebuilds `web` on every save. The `web` page calls `api` over HTTPS through the proxy and trusts the devlanes CA without turning certificate checks off.

## Requirements

- devlanes, with `devlanes setup` run once
- Go 1.26 or later
- [Task](https://taskfile.dev/installation/) (`task` on `PATH`)

The Taskfile runs a pinned air with `go run github.com/air-verse/air@v1.67.4`, which fetches and builds it on the first start.

## Run it

```sh
cd languages-go-api
devlanes start
```

`devlanes start --no-ui` prints the start as text:

```text
example-go-api@0 (main): 2/2 ready
ready web http://127.0.0.1:20621 https://example-go-api.localhost
ready api http://127.0.0.1:20620 https://api.example-go-api.localhost
```

Open https://example-go-api.localhost. The page says `This is lane 0 of example-go-api.`, lists the lane values, then shows the answer of the `api` service with its status, the latency of the call and the `SSL_CERT_FILE` path.

The first start downloads and builds air and both programs. If `devlanes start` stops waiting before that ends (after 180s by default), it prints `! timed out before every unit was ready` and the build goes on; `devlanes wait example-go-api@0 --timeout 10m` waits for it.

## During a start

1. devlanes runs `go run ./cmd/api` in this folder. `run_script` points at `go.mod` and a bare name is a folder under `cmd/`. The file also makes the platform `go`, so `api` gets `SSL_CERT_FILE` pointing at `~/.devlanes/ca/bundle.pem` (system roots plus the devlanes CA).
2. At the same time it runs `task --taskfile Taskfile.yml dev:web`. The `go.mod` next to the Taskfile makes this service's platform `go` too, so `web` gets the same `SSL_CERT_FILE`, and `BUILD_DIR` is the lane's data folder.
3. The task runs air, which builds `./cmd/web` into `BUILD_DIR` and starts it. air keeps its own files there too, so nothing is written to the worktree and two lanes running from this folder never share a binary.
4. Both listen on `HOST` and `PORT`. The `ready.http` check on `/healthz` gives each 10 minutes for the first build.
5. `web` answers at https://example-go-api.localhost and `api` at https://api.example-go-api.localhost. `API_URL` is `${{ services.api.public_url }}`, so each page load calls `https://api.example-go-api.localhost/items` through the proxy.

## Trusting the devlanes CA from Go

Go's default HTTP client verifies certificates with the operating system. On macOS and Windows that is the system store, which `devlanes setup` fills. On Linux Go reads the file in `SSL_CERT_FILE` instead of the distribution's bundle, and the `go` platform points it at the devlanes bundle, so the call works on a box or in CI where the CA is not in the system store.

On Linux, a Go program built without cgo looks the api's hostname up in DNS. If the page shows `no such host`, [Fix programs that cannot resolve \*.localhost](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/hostnames/resolve-localhost.md) makes `*.localhost` resolve. On macOS and Windows Go asks the operating system.

## Try next

- Change the heading in `internal/web/templates/home.html` and save. air logs `has changed`, rebuilds `web` and restarts it; reload the page to see the change.
- Change the stock of `Kettle` in `internal/api/items.go` from 12 to 11 and run `devlanes restart api`. `go run` rebuilds only what changed, and the next page load shows `"stock": 11`.
- Load the page a few times, then run `devlanes logs web --tail 3`. Each page load logs the api's status and how long the call took.
- `devlanes lane new --name example-go-api-review --start` starts a second lane from this same folder. https://example-go-api1.localhost answers with lane 1, and air builds its own `web` binary in that lane's data folder, so the two lanes never share one.
- Stop the api with `devlanes stop api` and reload the page. The card shows `503 Service Unavailable` and the proxy's `Service not running` page as the body. `devlanes start api` brings it back. `go run` exits with 1 when its program is stopped, so `devlanes stop` reports `exit=1`.
- Start a lane in a second worktree: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/languages-go-api && devlanes start`. With the review lane running it takes the next free index, 2, so the page is at https://example-go-api2.localhost and its api call goes to `https://api.example-go-api2.localhost`. Go's build cache is shared, so it builds quickly.
- `devlanes lane clean example-go-api-review --yes` stops the review lane and deletes its data folder, with the `web` binary in it. `devlanes lane clean 0 --yes` does the same for lane 0, and the second worktree's lane has its own index.

## Files

- [`devlanes.yaml`](devlanes.yaml): the `web` and `api` services, their run scripts, hostnames and ready checks, and `BUILD_DIR` and `API_URL`.
- [`Taskfile.yml`](Taskfile.yml): the `dev:web` task that runs air.
- [`go.mod`](go.mod): the module, with no dependencies.
- [`cmd/`](cmd): the `main` package of each program, which only starts the server.
- [`internal/`](internal): `config` reads the environment, `api` and `web` hold the handlers, `web/client.go` the HTTPS call and `web/templates/` the page.

## Docs

- [Run Node, Bun, Deno, Python, Rust and Go services](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/runtimes.md)
- [Run scripts your project already has](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/run-scripts.md)
- [Trust the devlanes CA](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/hostnames/trust-the-ca.md)
