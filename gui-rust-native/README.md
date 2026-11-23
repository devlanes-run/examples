# Rust native desktop app

A native desktop window written in Rust with egui, run by devlanes as a service next to the small axum API it calls. Each lane opens its own window, titled with the lane, that calls its own lane's API over HTTPS and keeps its state in the lane's data folder, so two lanes run side by side without sharing anything.

## Requirements

- devlanes, with `devlanes setup` run once
- Rust 1.95 or later
- On Linux, the GTK 3 development files for the file dialog (`libgtk-3-dev` on Debian and Ubuntu)

## Run it

```sh
cd gui-rust-native
devlanes start
```

A window titled `Lane 0 of example-rust-native` opens on your desktop. It says `This is lane 0 of example-rust-native.`, lists the lane values, shows the answer of the `api` service from https://example-rust-native.localhost, and has a list of 500 rows on the right.

The first start compiles egui and its dependencies. If `devlanes start` stops waiting before that ends, `devlanes wait example-rust-native@0 --timeout 10m` waits for it.

## During a start

1. devlanes runs `cargo run -p api --bin api` and `cargo run -p desktop --bin desktop` at the same time. Both build into the same `target/`, so one waits for the other's build.
2. `api` listens on `HOST` and `PORT` and answers at https://example-rust-native.localhost. Its ready check asks `/healthz`.
3. `desktop` opens the window and prints `window open: Lane 0 of example-rust-native`, the line its `ready.log` check waits for. It has no hostname, and it does not use the `PORT` devlanes gives every service.
4. The window calls `${{ services.api.public_url }}` through the proxy. reqwest loads the devlanes CA from the `SSL_CERT_FILE` that the `rust` platform sets. While the api is still compiling, the window retries for 30 seconds.

## The window

The window draws what a devlanes example page shows: the logo and wordmark, a title naming the lane, the lane card and the api's answer. A native window cannot load `_internal/brand/devlanes.css`, so [`crates/desktop/src/theme.rs`](crates/desktop/src/theme.rs) holds its colour values under the same names. The logo comes from the `brand` link, as in the other examples. The `url` row of the lane card is where the proxy says the window reached the api, because a window has no URL of its own.

The rest of the window is there to exercise a window: a note input, the 500-row list with a right-click menu on each row, a File, Edit and View menu bar, a button that opens the system's open-file dialog and shows the path, and a button that opens a second window. The status line at the bottom names the last thing done, and `devlanes logs desktop` prints the same lines.

The note, the picked file and the window's size and position are saved to `desktop.ron` in `${{ lane.data_path }}`, so each lane remembers its own and the worktree stays clean.

## Try next

- Type a note, move the window and run `devlanes restart desktop`. The window opens where you left it, with the note.
- Run `devlanes stop api`, then choose View > Call the api again. The card shows `503`, the proxy's answer while the service is stopped. `devlanes start api` and another call bring back `200`.
- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/gui-rust-native && devlanes start`. A second window titled `Lane 1 of example-rust-native` opens, with another lane colour in its card, and calls https://example-rust-native1.localhost. The worktree has its own `target/`, so its first start compiles everything again.
- Without a second worktree, `devlanes lane new --name example-rust-native-review --start` adds a lane in this folder. It shares this `target/`, so its window opens without compiling.
- `devlanes stop desktop` closes the window. On Windows devlanes asks it to close, as clicking its close button does.
- `devlanes lane clean 0 --yes` stops lane 0 and deletes its data folder, so its next start opens with an empty note at the default position.

## Files

- [`devlanes.yaml`](devlanes.yaml): the `api` and `desktop` services, the ready checks, `API_URL` and `STATE_DIR`.
- [`Cargo.toml`](Cargo.toml): the workspace, its pinned dependencies and the OpenGL renderer for eframe.
- [`crates/desktop/`](crates/desktop): the window. `src/app.rs` lays it out, `src/cards.rs` draws the lane card and the api's answer, `src/surfaces.rs` and `src/menu.rs` hold the list, dialogs, menus and second window.
- [`crates/api/`](crates/api): the JSON API with `/`, `/lane` and `/healthz`.

## Docs

- [Run and run_script](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/run-scripts.md)
- [Wait until a service is ready](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/ready-checks.md)
- [Lane data folder](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/files.md#lane-data-folder)
- [If a service calls another hostname over HTTPS](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/runtimes.md#if-a-service-calls-another-hostname-over-https)
