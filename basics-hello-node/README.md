# Hello Node

A small TypeScript server built with [Hono](https://hono.dev). devlanes gives it a port through `PORT`, routes `https://example-hello-node.localhost` to it with `hosts`, and waits for its `/healthz` route with an `http` ready check. A second Git worktree runs a second copy as lane 1 at `https://example-hello-node1.localhost`. Start here if devlanes is new to you.

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
example-hello-node@0 (main): 1/1 ready
ready web http://127.0.0.1:20400 https://example-hello-node.localhost
```

Open https://example-hello-node.localhost. The page says `This is lane 0 of example-hello-node.` and lists the lane, branch, service, port and URL that answered. https://example-hello-node.localhost/lane returns the same values as JSON.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0, named `main`.

1. The first start of a lane runs the `install` task (`npm install`), because a new worktree has no `node_modules`.
2. devlanes reserves a block of ports for the lane and picks one for the `web` service.
3. It runs `npm run dev`, which is `tsx watch src/index.ts`, with `PORT` and `HOST=127.0.0.1` set.
4. The ready check requests `/healthz` on that port until the server answers `200 ok`. Only then is `web` ready and the start done.
5. The proxy routes `https://example-hello-node.localhost` to the port.

`src/env.ts` reads what devlanes set: `DEVLANES_LANE` and `DEVLANES_LANE_NAME` for the lane, `LANE_LABEL` (from `${{ lane.label }}` in `global_env`) for the branch, `DEVLANES_SERVICE` and `PORT`. The URL comes from the `X-Forwarded-Host` header the proxy adds, so a request that skips the proxy shows `not through the proxy` there instead.

## Try next

- `devlanes status` lists the lane, the service and the `install` task:

  ```text
  example-hello-node
    LANE  BRANCH  STATE    SERVICES  CPU   MEM       URL
    0     main    running  1/1       0.0%  87.4 MiB  https://example-hello-node.localhost
  ```

- `devlanes logs web` prints what the server wrote:

  ```text
  web#2 > dev
  web#3 > tsx watch src/index.ts
  web#4
  web#5 hello-node listening on http://127.0.0.1:20400
  ```

- Edit the heading in `src/views/HomePage.tsx` and save. `tsx watch` restarts the server, `devlanes logs web` shows a `[tsx] change in ... Restarting...` line, and a reload of the page shows the change.
- `devlanes url open web` opens the page in your browser.
- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/basics-hello-node && devlanes start`. The new worktree is lane 1. Its page at https://example-hello-node1.localhost says `This is lane 1 of example-hello-node.`, with another port and lane colour, while lane 0 keeps running.
- `devlanes stop` in this folder stops lane 0. Reload the page: the proxy answers with its own `Service not running` page (503, `DL201 service-idle`) and the command that starts the lane again.
- When you are done, `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `1` for the second worktree's lane.

## Files

- `devlanes.yaml`: the `install` task and the `web` service with `run_script`, `hosts` and the `/healthz` ready check.
- `src/index.ts`: starts the server on `PORT` and `HOST`.
- `src/env.ts`: every variable the service reads, parsed once.
- `src/app.tsx`: the routes.
- `src/views/`: the page as JSX components (`Layout`, `LaneCard`, `HomePage`).
- `brand`: a link to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [Getting started](https://github.com/devlanes-run/devlanes/blob/main/docs/getting-started.md)
- [Run and run_script](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md)
- [Ports and environment](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md)
- [DL201 Service not running](https://github.com/devlanes-run/devlanes/blob/main/docs/errors/service-idle.md)
