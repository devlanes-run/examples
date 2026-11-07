# WebSockets and SSE

One Node process streams Server-Sent Events, runs a WebSocket echo chat and serves an admin JSON view, each on its own port behind its own hostname. It shows WebSockets and SSE through the devlanes proxy with nothing to configure, extra ports from `self.ports.<name>`, and hostnames routed to them with `hosts[].port`. The server uses [Hono](https://hono.dev); the page's browser code is TypeScript bundled by [Vite](https://vite.dev).

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (tested with Node 24 and npm 11)

## Run it

```sh
cd web-realtime-ws
devlanes start
```

On a terminal, `devlanes start` opens the TUI and follows the start there. `devlanes start --no-ui` prints it as text instead:

```text
example-realtime-ws@0 (main): 1/1 ready
ready realtime http://127.0.0.1:20421 https://example-realtime-ws.localhost
```

Open https://example-realtime-ws.localhost. The page says `This is lane 0 of example-realtime-ws.`, shows a tick from `/events` every second, and has a chat that echoes each message tagged with the lane and the hostname it came through.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0, named `main`.

1. The first start of a lane runs the `install` task (`npm install`), because a new worktree has no `node_modules`.
2. The `realtime` service's `env` mentions `self.ports.ws` and `self.ports.admin`, so devlanes gives it two more ports next to `PORT`, with the same offsets in every lane.
3. It runs `npm run dev`, which builds the page's browser code from `src/client/` into `dist/client` with Vite, then runs `tsx watch src/index.ts`. Server edits restart the server; after a client edit, `devlanes restart realtime` rebuilds it.
4. The server opens the `ws` and `admin` ports first and the main port last, so the `http` ready check on `/healthz` passes once all three listen.

| Hostname                              | Port                   | Serves                                                                |
| ------------------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `example-realtime-ws.localhost`       | main (`PORT`)          | the page, SSE on `/events`, a WebSocket on `/ws`, `/lane`, `/healthz` |
| `ws.example-realtime-ws.localhost`    | `ws` (`WS_PORT`)       | the chat's WebSocket, on any path                                     |
| `admin.example-realtime-ws.localhost` | `admin` (`ADMIN_PORT`) | connections, ticks and recent messages as JSON                        |

Every port answers `/healthz` and `/lane`, so each hostname can be checked on its own. WebSockets and SSE need no key in `devlanes.yaml`: the proxy bridges upgrades on any hostname and path and streams `/events` without buffering. The page opens both `wss://ws.example-realtime-ws.localhost` and `wss://example-realtime-ws.localhost/ws` to show that the main port takes upgrades too. Since the page and the ws hostname are different origins, the server accepts a browser's socket only when its `Origin` is in `DEVLANES_ORIGINS`, and answers others with 403.

`devlanes status` lists the service's three ports, and `devlanes url ls` the hostname that answers on each:

```text
$ devlanes status
example-realtime-ws
  LANE  BRANCH  STATE    SERVICES  CPU   MEM       URL
  0     main    running  1/1       0.0%  29.2 MiB  https://example-realtime-ws.localhost

  UNIT      STATE   PORT               CPU   MEM       URL
  realtime  ready   20420,20421,20422  0.0%  29.2 MiB  https://example-realtime-ws.localhost
  install   exited  –                  –     –

$ devlanes url ls | grep example-realtime-ws
example-realtime-ws.localhost                ->  example-realtime-ws@0:realtime        20421  ready
ws.example-realtime-ws.localhost             ->  example-realtime-ws@0:realtime        20422  ready
admin.example-realtime-ws.localhost          ->  example-realtime-ws@0:realtime        20420  ready
```

`url ls` lists the hostnames of every project on the machine, hence the `grep`. Your port numbers will differ.

## Try next

On Windows, add `--ssl-revoke-best-effort` to the `curl` commands.

- `curl -N https://example-realtime-ws.localhost/events` prints a tick every second as it happens, such as `data: {"lane":0,"tick":7,"time":"2026-11-07T01:07:20.376Z"}`.
- With a curl that lists `ws wss` under Protocols in `curl --version`, `curl -s --max-time 2 wss://ws.example-realtime-ws.localhost` prints the hello frame: `{"type":"hello","lane":0,"lane_name":"main","via":"ws.example-realtime-ws.localhost","port_name":"ws","port":20422}`.
- Send a message from the terminal while the page is open: `devlanes exec --name chat -- npm run chat -- hello from the terminal`. The page shows `lane 0 via ws.example-realtime-ws.localhost, port ws: hello from the terminal`, and `devlanes logs chat` prints the same echo as `lane 0 (main) via ws.example-realtime-ws.localhost, port ws: hello from the terminal`.
- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/web-realtime-ws && devlanes start`. The new worktree is lane 1. Open https://example-realtime-ws1.localhost and send a message there: it shows up tagged `lane 1` and never reaches lane 0's page, because each lane runs its own process on its own ports. Without a second worktree, `devlanes lane new --name example-realtime-ws-review --start` in this folder gives the same lane 1, and `devlanes exec --lane example-realtime-ws-review --name chat -- npm run chat -- hi` talks to it.
- Freeze the lane with the page open: `devlanes debug freeze`. `devlanes status` shows `running frozen 8s` for the lane and `frozen` for `realtime`, and the page's SSE card counts up `11s ago, no tick since`. Type a message and send it: the bytes on the open WebSocket count as activity, so the proxy thaws the lane, the echo comes back and the ticks resume. `devlanes debug events` lists `lane.thawed example-realtime-ws@0 from frozen by a request`.
- Open https://admin.example-realtime-ws.localhost after the freeze: `connections` counts the page's SSE stream and its two sockets, and `sse_ticks` trails `uptime_s` by about the time the lane spent frozen.
- When you are done, `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `1` for the second worktree's lane, or `example-realtime-ws-review` for the extra lane of this folder.

## Files

- `devlanes.yaml`: the `realtime` service with its named ports and three hostnames, and the `install` task.
- `src/index.ts`: starts the three servers, the main port last.
- `src/servers/`: one module per port (`main.ts`, `ws.ts`, `admin.ts`), each mounting its routes.
- `src/routes/`: `/events` with `streamSSE`, the chat upgrade with its `Origin` check, the admin view and the page.
- `src/realtime/`: the tick counter and the chat rooms both ports share.
- `src/client/`: the page's `EventSource` and WebSocket code, built by `vite.config.ts`.
- `src/scripts/chat.ts`: sends one chat message from the terminal and prints the echo.
- `brand`: a link to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [WebSockets, SSE and long polling](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#websockets-sse-and-long-polling)
- [Several ports, several hostnames](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#several-ports-several-hostnames)
- [Several ports for one service](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#several-ports-for-one-service)
- [Idle lanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#idle-lanes)
