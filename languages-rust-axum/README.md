# Rust axum services with run_script on Cargo.toml

Two axum binaries from one Cargo package, each started with `run_script: { file: Cargo.toml, name: <bin> }`. The `web` binary calls the `api` binary over HTTPS with reqwest and native roots, which trust the devlanes CA through the `SSL_CERT_FILE` that the `rust` platform sets. Both have a `ready.http` check with a 10 minute `timeout` for the first build.

## Requirements

- devlanes, with `devlanes setup` run once
- Rust 1.85 or later (tested with 1.99.1)

## Run it

```sh
cd languages-rust-axum
devlanes start
```

Open https://rust-axum.localhost. The page shows lane 0 of `rust-axum`, then the answer of the `api` service with its status, the latency of the call and the `SSL_CERT_FILE` path.

The first start compiles the dependencies, which took about 20 seconds on the machine this was tested on. If `devlanes start` stops waiting before that ends (after 180s by default), it prints `! timed out before every unit was ready` and the build goes on; `devlanes wait rust-axum@0 --timeout 10m` waits for it.

## During a start

1. devlanes runs `cargo run --bin web` and `cargo run --bin api` in this folder at the same time. `Cargo.toml` makes the platform `rust`, so both get `SSL_CERT_FILE` pointing at `~/.devlanes/ca/bundle.pem` (system roots plus the devlanes CA) and `CARGO_TERM_COLOR=always`.
2. Both build into the same `target/`, so one waits for the other's build. Its log shows `Blocking waiting for file lock on build directory`, then compiles only its own binary. The `ready.http` check on `/healthz` gives each 10 minutes.
3. `api` listens on `HOST` and `PORT` and answers at https://api.rust-axum.localhost: `/` with the lane values and mock items, `/api/items`, `/lane` and `/healthz`. It allows the origins in `DEVLANES_ORIGINS` for CORS.
4. `web` answers at https://rust-axum.localhost. `API_URL` is `${{ services.api.public_url }}`, so each page load calls `https://api.rust-axum.localhost/api/items` through the proxy. reqwest is built with `rustls-tls-native-roots`, which loads the certificates in `SSL_CERT_FILE` instead of the system store, so the call works without turning certificate checks off.

The lane card reads `DEVLANES_LANE`, `DEVLANES_LANE_NAME`, `LANE_LABEL`, `DEVLANES_SERVICE` and `PORT`; `url` is `https://` plus the `X-Forwarded-Host` header the proxy sends.

## Try next

- Change the stock of `Anvil` in `src/bin/api.rs` from 12 to 11 and run `devlanes restart api`. Cargo rebuilds only that binary (`Finished ... in 0.48s`) and the next page load shows `"stock": 11`. Nothing watches the files, so `devlanes restart web` is how `web` picks up an edit.
- Load the page a few times, then run `devlanes logs web --tail 3`. Each page load logs the api's status and how long the call took:

  ```text
  web#49 GET / called https://api.rust-axum.localhost/api/items: 200 in 6 ms
  web#50 GET / called https://api.rust-axum.localhost/api/items: 200 in 3 ms
  web#51 GET / called https://api.rust-axum.localhost/api/items: 200 in 0 ms
  ```

  The first call after a start includes the TLS handshake; later calls reuse the connection.

- Point `SSL_CERT_FILE` at a file with no certificates: create an empty `empty.pem` and run `devlanes restart web --env SSL_CERT_FILE=empty.pem`. The page now shows `request failed` and `invalid peer certificate: UnknownIssuer`, even though `devlanes setup` put the CA in the system store, because native roots read only that file. The restarted unit keeps the `--env` value, so undo it with `devlanes stop web` and `devlanes start web`, then delete `empty.pem`.
- Start a second lane in this folder: `devlanes lane new --name review --start`. https://rust-axum1.localhost says `This is lane 1 of rust-axum.` and its api call goes to `https://api.rust-axum1.localhost`. The lane shares this folder and its `target/`, so it starts without compiling (`Finished ... in 0.15s`). On Windows a running `.exe` cannot be replaced, so while the review lane runs `api`, `devlanes restart api` in lane 0 fails with `failed to remove file ...\target\debug\api.exe` and `Access is denied. (os error 5)`; run `devlanes stop review:api` first. A second worktree (see the [repository README](../README.md#a-second-lane)) has its own `target/`, so its first start compiles everything again. `devlanes lane clean review --yes` removes the extra lane.

## Files

- `devlanes.yaml`: the `web` and `api` services, their hostnames and ready checks, and `API_URL`.
- `Cargo.toml`: one package with pinned axum, tokio, serde_json and reqwest (default features off, `rustls-tls-native-roots` on).
- `src/bin/web.rs`: the page, the HTTPS call to `api` and the request log line.
- `src/bin/api.rs`: the JSON API with its mock items and CORS from `DEVLANES_ORIGINS`.
- `src/lib.rs`: the `HOST`/`PORT` listener and the `/lane` values both binaries use.
- `devlanes.css`, `logo.svg`: the devlanes look, embedded into `web` with `include_str!`.

## Docs

- [Languages: Rust](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/languages.md#rust)
- [Run and run_script: Cargo.toml](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md#cargotoml)
- [Programs started by devlanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-started-by-devlanes)
