# Electron desktop app

An [Electron](https://www.electronjs.org) app whose window loads a Vite + React renderer with hot reload, and a [Hono](https://hono.dev) API the renderer calls. Each lane opens its own window on its own renderer and API, with its own Electron profile, so two lanes' apps run side by side.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.12 or later
- A desktop session on the machine that runs the lane, since the window opens there

## Run it

```sh
cd gui-electron
devlanes start
```

A window titled `example-electron@0 (main) window 1` opens. It shows `This is lane 0 of example-electron.`, the lane card of `web`, the notes it fetched from https://api.example-electron.localhost, what the Electron shell reports about itself, and a text input, file and window buttons and a 500-row list to try input on. The menu bar has File, Edit and View, and a right-click anywhere opens a native context menu. https://example-electron.localhost shows the same page in a browser, without the native parts.

## During a start

1. The first start of a lane runs the `install` task: one `npm install` at the example root installs `apps/api`, `apps/web` and `apps/desktop`, and the desktop app's `postinstall` downloads Electron.
2. `api` runs `tsx watch src/index.ts` and serves https://api.example-electron.localhost.
3. `web` runs `vite` with the flags `preset: vite` adds and serves the renderer at https://example-electron.localhost.
4. `desktop` compiles the main process with `tsc` and runs `electron .`. devlanes starts the three services together, so the main process polls `RENDERER_URL` until `web` answers, then opens the window. It counts as ready once it prints `window 1 loaded`.

## The window and the lane

`desktop` is an ordinary service with no hostname. Its environment ties the app to its lane:

- `RENDERER_URL: ${{ services.web.public_url }}` is the renderer's https hostname. The window is a Chromium browser, so it loads the page through the devlanes proxy like a browser tab, trusts the devlanes CA through the system trust store that `devlanes setup` filled, and calls the API cross-origin with CORS from `DEVLANES_ORIGINS`.
- `ELECTRON_USER_DATA: ${{ lane.data_path }}/electron` is the folder the main process passes to `app.setPath("userData")`. Electron keeps cookies, storage and cache there and locks it, so each lane needs a folder of its own. The page shows it under `user data`.
- `PORT`, the port devlanes gives every service, is where the main process serves the Chrome DevTools Protocol on 127.0.0.1, so a tool such as Playwright can drive the windows. Any program on the machine can control the app through that port, as with a Node inspector port, so an app with real data should leave it out.

## Try next

- Edit the heading in `apps/web/src/App.tsx` and save. The window updates without reloading, and `devlanes logs web` shows `[vite] (client) hmr update /src/App.tsx`.
- Click New window, or use File > New window. A second window titled `window 2` opens on the same renderer.
- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/gui-electron && devlanes start`. To stay in this folder instead, run `devlanes lane new --name example-electron-review --start`. A second window opens with `This is lane 1 of example-electron.`, notes from https://api.example-electron1.localhost and another `user data` folder, while lane 0's window stays open.
- `devlanes status` lists the port of `desktop`. `curl http://127.0.0.1:<port>/json/list` lists the open windows and the URL each one loaded.
- Close the window. The app exits, `devlanes status` shows `desktop` as `stopped exit=0`, and `devlanes start desktop` opens it again.
- `devlanes stop web`, then View > Reload in the window. It shows the proxy's `Service not running` page (`DL201 service-idle`). `devlanes start web` and another reload bring the renderer back.
- `devlanes lane clean 0 --yes` stops lane 0, closes its window and deletes its data, the Electron profile included. Run it with `example-electron-review` for the lane from `lane new`, or with `1` from the second worktree.

## Files

- [`devlanes.yaml`](devlanes.yaml): the `install` task, `api`, `web` with `preset: vite`, and `desktop` with `RENDERER_URL` and `ELECTRON_USER_DATA`.
- [`apps/desktop/src/`](apps/desktop/src): the Electron main process. `main.ts` sets the user data folder, `windows.ts` opens windows, `menu.ts` and `context-menu.ts` build the native menus, `preload.cts` exposes `window.desktop` to the page.
- [`apps/web/src/`](apps/web/src): the renderer. `desktop.ts` types `window.desktop`, `components/` holds the cards.
- [`apps/api/src/app.ts`](apps/api/src/app.ts): the API's routes and CORS.

## Docs

- [Run Vite and Next.js](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/vite-and-next.md)
- [Expressions](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/expressions.md)
- [Files and folders: lane data folder](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/files.md#lane-data-folder)
- [Wait until a service is ready](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/ready-checks.md)
