# Hello Node

One Node server, `server.mjs`, with no dependencies. devlanes gives it a port through `PORT`, routes `https://hello-node.localhost` to it with `hosts`, and waits for its `/healthz` route with an `http` ready check. A second Git worktree runs a second copy as lane 1 at `https://hello-node1.localhost`. Start here if devlanes is new to you.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (tested with Node 24 and npm 11)

## Run it

```sh
cd basics-hello-node
devlanes start
```

On a terminal, `devlanes start` opens the TUI and follows the start there. `devlanes start --no-ui` prints it as text instead:

```text
hello-node@0 · main
✓ services  1 of 1 ready
  ✓  web  https://hello-node.localhost
```

Open https://hello-node.localhost. The page says `This is lane 0 of hello-node.` and lists the lane, branch, service, port and URL that answered. https://hello-node.localhost/lane returns the same values as JSON.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0, named `main`.

1. devlanes reserves a block of ports for the lane and picks one for the `web` service.
2. It runs `npm run dev` from `package.json` (npm because of its `packageManager` field), which runs `node --watch server.mjs` with `PORT` and `HOST=127.0.0.1` set.
3. The ready check requests `/healthz` on that port until the server answers `200 ok`. Only then is `web` ready and the start done.
4. The proxy routes `https://hello-node.localhost` to the port.

The page reads its values from the environment devlanes set: `DEVLANES_LANE` and `DEVLANES_LANE_NAME` for the lane, `LANE_LABEL` (from `${{ lane.label }}` in `global_env`) for the branch, `DEVLANES_SERVICE` and `PORT`. The URL comes from the `X-Forwarded-Host` header the proxy adds, so a request that skips the proxy shows `not through the proxy` there instead.

## Try next

- `devlanes status` lists the lane and its service:

  ```text
  hello-node
    LANE  BRANCH  STATE    SERVICES  CPU   MEM       URL
    0     main    running  1/1       0.6%  56.0 MiB  https://hello-node.localhost

    UNIT  STATE  PORT   CPU   MEM       URL
    web   ready  20400  0.6%  56.0 MiB  https://hello-node.localhost
  ```

- `devlanes logs web` prints what the server wrote. Each line starts with a cursor such as `web#5`:

  ```text
  web#1
  web#2 > dev
  web#3 > node --watch server.mjs
  web#4
  web#5 hello-node listening on http://127.0.0.1:20400
  ```

- Edit the title in `server.mjs` and save. `node --watch` restarts the server, `devlanes logs web` shows `Restarting 'server.mjs'`, and a reload of the page shows the change.
- `devlanes url open web` opens https://hello-node.localhost in your browser.
- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/basics-hello-node && devlanes start`. The new worktree is lane 1. Its page at https://hello-node1.localhost says `This is lane 1 of hello-node.`, with another port and lane colour, while lane 0 keeps running. `devlanes status` lists both lanes.
- `devlanes stop` in this folder stops lane 0. Reload https://hello-node.localhost: the proxy answers with its own `Service not running` page (503, `DL201 service-idle`) and the commands that start the lane again. Lane 1 keeps answering.
- `devlanes start` brings lane 0 back, and a reload shows the page again.
- Run `devlanes` with no command to open the TUI. It lists every lane of the project, the state of `web` in each and a live terminal for the selected one. Closing it leaves everything running.
- When you are done, `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `1` for the second worktree's lane.

## Files

- `devlanes.yaml`: the `web` service with `run_script`, `hosts` and the `/healthz` ready check.
- `package.json`: the `dev` script and `packageManager`.
- `server.mjs`: the server, using only `node:http` and `node:fs`. It serves the page, `/lane`, `/healthz`, `devlanes.css` and `logo.svg`.
- `devlanes.css`, `logo.svg`: the page's look, copied from `_template`.

## Docs

- [Getting started](https://github.com/devlanes-run/devlanes/blob/main/docs/getting-started.md)
- [Run and run_script](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md)
- [Ports and environment](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md)
- [Config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md)
- [DL201 Service not running](https://github.com/devlanes-run/devlanes/blob/main/docs/errors/service-idle.md)
