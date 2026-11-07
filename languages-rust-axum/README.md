# Rust and axum

Two axum binaries in one Cargo workspace, each started with `run_script: { file: Cargo.toml, name: <bin> }` on the workspace manifest. The `web` binary renders an askama page and calls the `api` binary over HTTPS with reqwest and native roots, which trust the devlanes CA through the `SSL_CERT_FILE` that the `rust` platform sets. Both have a `ready.http` check with a 10 minute `timeout` for the first build.

## Requirements

- devlanes, with `devlanes setup` run once
- Rust 1.88 or later (tested with 1.98.1)

## Run it

```sh
cd languages-rust-axum
devlanes start
```

On a terminal, `devlanes start` opens the TUI and follows the start there. `devlanes start --no-ui` prints it as text instead:

```text
example-rust-axum@0 (main): 2/2 ready
ready web http://127.0.0.1:20641 https://example-rust-axum.localhost
ready api http://127.0.0.1:20640 https://api.example-rust-axum.localhost
```

Open https://example-rust-axum.localhost. The page says `This is lane 0 of example-rust-axum.`, lists the lane values, then shows the answer of the `api` service with its status, the latency of the call and the `SSL_CERT_FILE` path.

The first start compiles the dependencies, which took 16 seconds on the machine this was tested on. If `devlanes start` stops waiting before that ends (after 180s by default), it prints `! timed out before every unit was ready` and the build goes on; `devlanes wait example-rust-axum@0 --timeout 10m` waits for it.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0, named `main`.

1. devlanes runs `cargo run -p web --bin web` and `cargo run -p api --bin api` in this folder at the same time. `run_script` points at the workspace `Cargo.toml`, so devlanes looks up the member that owns each binary and adds `-p`. The file also makes the platform `rust`, so both get `SSL_CERT_FILE` pointing at `~/.devlanes/ca/bundle.pem` (system roots plus the devlanes CA) and `CARGO_TERM_COLOR=always`.
2. Both build into the same `target/`, so one waits for the other's build. Its log shows `Blocking waiting for file lock on build directory`, then compiles only its own crate. The `ready.http` check on `/healthz` gives each 10 minutes.
3. `api` listens on `HOST` and `PORT` and answers at https://api.example-rust-axum.localhost: `/` with the lane values and mock items, `/api/items`, `/lane` and `/healthz`. It allows the origins in `DEVLANES_ORIGINS` for CORS.
4. `web` answers at https://example-rust-axum.localhost. `API_URL` is `${{ services.api.public_url }}`, so each page load calls `https://api.example-rust-axum.localhost/api/items` through the proxy. reqwest is built with `rustls-tls-native-roots`, which loads the certificates in `SSL_CERT_FILE` instead of the system store, so the call works without turning certificate checks off.

`crates/shared/src/config.rs` reads what devlanes set: `DEVLANES_LANE` and `DEVLANES_LANE_NAME` for the lane, `LANE_LABEL` (from `${{ lane.label }}` in `global_env`) for the branch, `DEVLANES_SERVICE` and `PORT`. The URL comes from the `X-Forwarded-Host` header the proxy adds, so a request that skips the proxy shows `not through the proxy` there instead.

## Try next

- Change the stock of `Anvil` in `crates/api/src/items.rs` from 12 to 11 and run `devlanes restart api`. Cargo rebuilds only that crate (`Finished ... in 1.08s`) and the next page load shows `"stock": 11`. Nothing watches the files, so `devlanes restart web` is how `web` picks up an edit.
- Load the page a few times, then run `devlanes logs web --tail 3`. Each page load logs the api's status and how long the call took:

  ```text
  web#52 GET / called https://api.example-rust-axum.localhost/api/items: 200 in 8 ms
  web#53 GET / called https://api.example-rust-axum.localhost/api/items: 200 in 0 ms
  web#54 GET / called https://api.example-rust-axum.localhost/api/items: 200 in 0 ms
  ```

  The first call after a start includes the TLS handshake; later calls reuse the connection.

- Point `SSL_CERT_FILE` at a file with no certificates: create an empty `empty.pem` and run `devlanes restart web --env SSL_CERT_FILE=empty.pem`. The page now shows `request failed` and `invalid peer certificate: UnknownIssuer`, even though `devlanes setup` put the CA in the system store, because native roots read only that file. The restarted unit keeps the `--env` value, so undo it with `devlanes stop web` and `devlanes start web`, then delete `empty.pem`.
- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/languages-rust-axum && devlanes start`. The new worktree is lane 1. https://example-rust-axum1.localhost says `This is lane 1 of example-rust-axum.`, with another port and lane colour, and its api call goes to `https://api.example-rust-axum1.localhost`. The worktree has its own `target/`, so its first start compiles everything again.
- Without a second worktree, `devlanes lane new --name example-rust-axum-review --start` adds lane 1 in this folder. It shares this `target/`, so it starts without compiling (`Finished ... in 0.15s`). On Windows a running `.exe` cannot be replaced, so while that lane runs `api`, `devlanes restart api` in lane 0 after an edit fails with `failed to remove file ...\target\debug\api.exe` and `Access is denied. (os error 5)`; run `devlanes stop example-rust-axum-review:api` first.
- When you are done, `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `1` for the second lane.

## Files

- `devlanes.yaml`: the `web` and `api` services, their hostnames and ready checks, and `API_URL`.
- `Cargo.toml`: the workspace, with pinned askama, axum, tokio, serde and reqwest (default features off, `rustls-tls-native-roots` on).
- `crates/web/`: the page. `src/routes.rs` has the handlers, `src/api.rs` the HTTPS call to `api`, `src/views.rs` and `templates/` the askama layout and page.
- `crates/api/`: the JSON API. `src/routes.rs` has the handlers and CORS from `DEVLANES_ORIGINS`, `src/items.rs` the mock items.
- `crates/shared/`: the config read from the environment, the `/lane` values and the `HOST`/`PORT` listener both binaries use, and `brand`, a link to `_internal/brand` that `web` embeds with `include_str!`.

## Docs

- [Languages: Rust](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/languages.md#rust)
- [Run and run_script: Cargo.toml](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md#cargotoml)
- [Programs started by devlanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-started-by-devlanes)
