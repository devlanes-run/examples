# WebSocket and SSE through the proxy, on named ports

One Node process streams Server-Sent Events, runs a WebSocket echo chat and serves an admin JSON view, each on its own port behind its own hostname. It shows WebSockets and SSE through the devlanes proxy with nothing to configure, extra ports from `self.ports.<name>`, and hostnames routed to them with `hosts[].port`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 24 with npm

## Run it

```sh
cd web-realtime-ws
devlanes start
```

Open https://realtime-ws.localhost. The page shows lane 0 of `realtime-ws`, a tick from `/events` every second, and a chat that echoes each message tagged with the lane and the hostname it came through.

## During a start

1. The `install` task (`when: lane.create`) runs `npm install` the first time a lane starts, since a new worktree has no `node_modules`.
2. The `realtime` service runs `node server.mjs` through `run_script`. Its `env` mentions `self.ports.ws` and `self.ports.admin`, so devlanes gives it two more ports next to `PORT`, with the same offsets in every lane. `server.mjs` opens the main port last, so the `http` ready check on `/healthz` passes once all three ports listen.

| Hostname | Port | Serves |
| --- | --- | --- |
| `realtime-ws.localhost` | main (`PORT`) | the page, SSE on `/events`, a WebSocket on `/ws`, `/lane`, `/healthz` |
| `ws.realtime-ws.localhost` | `ws` (`WS_PORT`) | the chat's WebSocket, on any path |
| `admin.realtime-ws.localhost` | `admin` (`ADMIN_PORT`) | connections, ticks and recent messages as JSON |

WebSockets and SSE need no key in `devlanes.yaml`. The proxy bridges upgrades on any hostname and path and streams `/events` without buffering. The page opens both `wss://ws.realtime-ws.localhost` and `wss://realtime-ws.localhost/ws` to show that the main port takes upgrades too. Since the page and the ws hostname are different origins, the server accepts a browser's socket only when its `Origin` is in `DEVLANES_ORIGINS`.

`devlanes status` lists the service's three ports, and `devlanes url ls` the hostname that answers on each:

```
$ devlanes status
realtime-ws
  LANE  BRANCH  STATE    SERVICES  CPU   MEM      URL
  0     main    running  1/1       0.0%  3.1 MiB  https://realtime-ws.localhost

  UNIT      STATE   PORT               CPU   MEM      URL
  realtime  ready   20470,20471,20472  0.0%  3.1 MiB  https://realtime-ws.localhost
  install   exited  –                  –     –

$ devlanes url ls | grep realtime-ws
realtime-ws.localhost                    ->  realtime-ws@0:realtime         20471  ready
ws.realtime-ws.localhost                 ->  realtime-ws@0:realtime         20472  ready
admin.realtime-ws.localhost              ->  realtime-ws@0:realtime         20470  ready
```

`url ls` lists the hostnames of every project on the machine, hence the `grep`. Your port numbers will differ.

## Try next

On Windows, add `--ssl-revoke-best-effort` to the `curl` commands.

- `curl -N https://realtime-ws.localhost/events` prints a tick every second as it happens. With a curl that lists `ws wss` under Protocols in `curl --version`, `curl -s --max-time 2 wss://ws.realtime-ws.localhost` prints the hello frame: `{"type":"hello","lane":0,"lane_name":"main","via":"ws.realtime-ws.localhost","port_name":"ws","port":20472}`.
- Send a message from the terminal while the page is open: `devlanes exec --name chat -- node chat.mjs hello from the terminal`. The page shows `lane 0 via ws.realtime-ws.localhost, port ws: hello from the terminal`, and `devlanes logs chat` prints the same echo.
- Start a second lane in this folder: `devlanes lane new --name review --start`. Open https://realtime-ws1.localhost and send a message there: it shows up tagged `lane 1` and never reaches lane 0's page, because each lane runs its own process on its own ports. `devlanes exec --lane review --name chat -- node chat.mjs hi` talks to lane 1. A worktree of another branch gets its own lane the same way with a plain `devlanes start`.
- Freeze the lane with the page open: `devlanes debug freeze`. `devlanes status` shows `running frozen 8s` for the lane and `frozen` for `realtime`, and the page's SSE card counts up `11s ago, no tick since`. Type a message and send it: the bytes on the open WebSocket count as activity, so the proxy thaws the lane, the echo comes back and the ticks resume. `devlanes debug events` lists `lane.thawed realtime-ws@0 from frozen by a request`.
- Open https://admin.realtime-ws.localhost after the freeze: `connections` counts the page's SSE stream and its two sockets, and `sse_ticks` trails `uptime_s` by about the time the lane spent frozen.
- Clean up: `devlanes lane clean review --yes`, then `devlanes lane clean 0 --yes`.

## Files

- `devlanes.yaml`: the `realtime` service with its named ports and three hostnames, and the `install` task.
- `server.mjs`: the main, `ws` and `admin` servers, SSE ticks and the two chat rooms.
- `page.mjs`: the lane page.
- `public/app.js`: the page's `EventSource` and WebSocket clients.
- `chat.mjs`: sends one chat message from the terminal and prints the echo.

## Docs

- [WebSockets, SSE and long polling](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#websockets-sse-and-long-polling)
- [Several ports, several hostnames](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#several-ports-several-hostnames)
- [Several ports for one service](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#several-ports-for-one-service)
- [Idle lanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#idle-lanes)
