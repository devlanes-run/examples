# Tauri desktop app

A [Tauri 2](https://v2.tauri.app) desktop app with a React frontend served by Vite, and a [Hono](https://hono.dev) API it calls. Each lane runs its own copy of the app, with its own app data and its own lane's frontend, and two lanes' windows stay open side by side.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.12 or later
- Rust 1.90 or later, and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS (WebView2 on Windows, WebKitGTK on Linux)

## Run it

```sh
cd gui-tauri
devlanes start --timeout 20m
```

The first start compiles the Tauri app and its dependencies, which takes a few minutes, so the start gets a longer wait than the default 180s. Once it is ready, a window titled `example-tauri lane 0` opens on this machine's desktop. It says `This is lane 0 of example-tauri.`, shows the lane card, the app's identifier `com.acme.tauri.lane0.client1`, and the release list it fetched from https://api.example-tauri.localhost.

Below that are parts to try in the window: a button that opens the native open-file dialog and shows the chosen path, a button that opens a second window without a native frame, a text field and a list of 500 rows. The File menu has the same two actions, with Ctrl+O and Ctrl+N (Cmd on macOS), and the window shows the id of the last menu item picked.

## During a start

1. The first start of a lane runs the `install` task: one `npm install` at the example root installs `apps/api`, `apps/desktop` and the Tauri CLI.
2. `api` runs `tsx watch src/index.ts` and serves https://api.example-tauri.localhost.
3. `desktop-web` runs `vite` with the flags `preset: vite` adds and serves the app's pages on its own port, and at https://example-tauri.localhost for a browser.
4. `desktop` runs `tauri dev --config <file>`. `preset: tauri` writes that file per lane with the lane's `identifier`, `devUrl` (the `desktop-web` port) and an empty `beforeDevCommand`, and Tauri merges it over `tauri.conf.json`. Cargo builds into the lane's data folder (`CARGO_TARGET_DIR`), then the app opens its window.
5. The app prints `main window loaded http://127.0.0.1:<port>/` once the window has loaded its page, and the `ready.log` check waits for that line.

## One app per lane

Tauri keeps the app's data and the webview's storage under the bundle identifier. `tauri.conf.json` has one, `com.acme.tauri`, and `tauri.identifier` in `devlanes.yaml` replaces it with `com.acme.tauri.lane<N>.client<replica>`, so each lane gets its own folder (`%LOCALAPPDATA%\com.acme.tauri.lane1.client1` on Windows). devlanes refuses to start two copies that would share one.

The identifier and the dev URL are compiled into the executable, so lanes cannot share one `target/` folder: a second lane would rebuild the executable the first one is running, which Windows refuses with `Access is denied. (os error 5)`. `CARGO_TARGET_DIR` gives each lane and replica a build of its own, at the cost of one full compile each.

## Try next

- Start a second lane: `git worktree add ../examples-tauri -b feat/gui-tauri`, then `cd ../examples-tauri/gui-tauri && devlanes start --timeout 20m --no-ui`. It compiles the app again, then opens a second window, `example-tauri lane 1`, next to the first:

  ```text
  example-tauri@1 (feat/gui-tauri): 3/3 ready
  ready api http://127.0.0.1:20020 https://api.example-tauri1.localhost
  ready desktop-web http://127.0.0.1:20022 https://example-tauri1.localhost
  ready desktop http://127.0.0.1:20021
  ```

  That window shows `This is lane 1 of example-tauri.` and the identifier `com.acme.tauri.lane1.client1`, and loads its releases from https://api.example-tauri1.localhost. To stay in this folder instead, run `devlanes lane new --name example-tauri-review --start`, which gives lane 2.

- `devlanes logs api` shows the window's request to the API. React's development mode runs the request twice:

  ```text
  api#4 <-- GET /
  api#5 --> GET / 200 1ms
  api#6 <-- GET /
  api#7 --> GET / 200 1ms
  ```

- `devlanes stop desktop` closes the window. `api` and `desktop-web` keep running, and `devlanes start desktop` opens it again.
- Add `replicas: 2` under `desktop` in `devlanes.yaml`, then `devlanes stop desktop` and `devlanes start desktop --timeout 20m`. Two windows open, `desktop.1` and `desktop.2`, with the identifiers `com.acme.tauri.lane0.client1` and `com.acme.tauri.lane0.client2`.
- `devlanes lane clean 0 --yes` stops lane 0 and deletes its data, logs and Cargo build. Run it with `example-tauri-review` for the lane from `lane new`, or with `1` from the second worktree. The app data under the identifier stays where Tauri put it.

## Files

- [`devlanes.yaml`](devlanes.yaml): `api`, `desktop-web` with `preset: vite`, and `desktop` with `preset: tauri`, its `tauri` options and `CARGO_TARGET_DIR`.
- [`apps/desktop/src-tauri/`](apps/desktop/src-tauri): the Rust app. [`tauri.conf.json`](apps/desktop/src-tauri/tauri.conf.json) is the config the preset merges over, [`src/menu.rs`](apps/desktop/src-tauri/src/menu.rs) the native menu, [`src/second_window.rs`](apps/desktop/src-tauri/src/second_window.rs) the frameless window, [`capabilities/default.json`](apps/desktop/src-tauri/capabilities/default.json) what the pages may call.
- [`apps/desktop/src/`](apps/desktop/src): the pages. [`tauri.ts`](apps/desktop/src/tauri.ts) holds the calls into Tauri, [`components/TitleBar.tsx`](apps/desktop/src/components/TitleBar.tsx) the second window's `data-tauri-drag-region` title bar.
- [`apps/api/src/`](apps/api/src): the Hono API, with CORS for this lane's origins.

## Docs

- [Run a Tauri app](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/tauri.md)
- [Run Vite and Next.js](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/vite-and-next.md)
- [Wait until a service is ready](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/ready-checks.md)
- [Run workers and replicas](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/workers.md)
