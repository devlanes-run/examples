# Next.js app with an HTTPS sibling API

A Next.js 16 App Router app run with `preset: next`, next to a small Node API. The page is a server component that fetches the API twice while it renders: through the API's `public_url` over HTTPS, which works because devlanes sets `NODE_EXTRA_CA_CERTS` for the service, and through its `url` straight to the port.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 24 (Next 16 needs 20.9 or later) and the npm that comes with it

## Run it

```sh
cd web-next-app
npm install
devlanes start
```

Open https://next-app.localhost. A lane is one running copy of the project with its own ports and hostnames, one per worktree. The page shows lane 0 of `next-app`, the values devlanes gave the `web` service, and one card per API fetch with its result and time.

## During a start

- `api` runs `npm run api` (`node --watch api/server.mjs`) behind https://api.next-app.localhost. It answers `/` with the lane JSON and three mock orders, plus `/api/items`, `/lane` and `/healthz`, and allows the origins in `DEVLANES_ORIGINS` for CORS.
- `web` runs `npm run dev`, a plain `next dev`. `preset: next` appends `--port <port> --hostname 127.0.0.1`, after a `--` because the package manager is npm, so the log shows `next dev --port <port> --hostname 127.0.0.1`. Without `--hostname` Next would listen on `0.0.0.0`. The start waits for the `/healthz` route handler, with a 120 s timeout because `next dev` compiles each route on its first request.

The page reads the lane values from the environment and the `X-Forwarded-Host` header, then fetches `API_PUBLIC_URL` (`https://api.next-app.localhost`) and `API_URL` (`http://127.0.0.1:<port>`) one after the other. The first request goes through the devlanes proxy, so the API sees `X-Forwarded-Host`; the second goes straight to the port and the API sees no such header. Node trusts the proxy's certificate because devlanes points `NODE_EXTRA_CA_CERTS` at its CA for every Node service. The example sets neither that variable nor `NODE_TLS_REJECT_UNAUTHORIZED`.

The [presets guide](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#next) says to set `allowedDevOrigins` when Next warns about cross-origin dev requests. Next 16.4 allows `*.localhost` by default, so it does not warn here and HMR connects through https://next-app.localhost. A request for a `/_next/` file with `Origin: https://example.invalid` gets a 403, and the log prints `Blocked cross-origin request to Next.js dev resource` with the `allowedDevOrigins` line to add. A lane domain outside `.localhost`, such as one under the resolver strategy's `.test`, needs that line.

## Try next

- Run a second lane from the same folder: `devlanes lane new --name second`, then `devlanes start --lane second --env NEXT_DIST_DIR=.next/second`. https://next-app1.localhost shows lane 1, and both API cards report lane 1. `next dev` locks its output folder, so without the variable the second one exits with `Another next dev server is already running.` `next.config.ts` reads `NEXT_DIST_DIR`, and `tsconfig.json` already lists the types in `.next/second`, so Next leaves the file alone. A second worktree has its own `.next` and needs none of this. `devlanes url ls` lists both lanes:

  ```text
  next-app.localhost                       ->  next-app@0:web                 20511  ready
  api.next-app.localhost                   ->  next-app@0:api                 20510  ready
  next-app1.localhost                      ->  next-app@1:web                 20421  ready
  api.next-app1.localhost                  ->  next-app@1:api                 20420  ready
  ```

- See where the CA comes from: `devlanes env show web --explain | grep NODE_EXTRA_CA_CERTS` prints the path of `ca.pem` in your devlanes home, with the layer `contributor` (the Node platform) instead of `service` or `global`.
- Take the CA away: `devlanes restart web --env NODE_EXTRA_CA_CERTS=`. Reload the page: the HTTPS card shows `Error: self-signed certificate in certificate chain` while the direct card still answers. A plain `devlanes restart web` keeps the `--env` value; `devlanes stop web` and then `devlanes start web` bring the CA back.
- Stop the API with `devlanes stop api` and reload. The HTTPS card shows `HTTP 503 Service Unavailable` from the proxy, and the direct card `Error: connect ECONNREFUSED 127.0.0.1:<port>`. `devlanes start api` brings both back.
- Remove the second lane with `devlanes lane clean second --yes`.

## Files

- `devlanes.yaml`: the `web` service with `preset: next` and both API addresses, and the `api` service.
- `app/page.tsx`: the server component with the lane card and the two fetches.
- `app/lane/route.ts`, `app/healthz/route.ts`: route handlers for `/lane` and the ready check.
- `app/layout.tsx`, `app/globals.css`, `public/logo.svg`: the devlanes look, ported from `_template`.
- `lib/lane.ts`: the `/lane` values, shared by the page and the route handler.
- `api/server.mjs`: the API on `node:http`, no dependencies.
- `next.config.ts`: `NEXT_DIST_DIR` for lanes that share a folder, and `agentRules: false`, which stops `next dev` from writing an `AGENTS.md` here when a coding agent runs devlanes.

## Docs

- [Framework presets: Next](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#next)
- [Programs started by devlanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-started-by-devlanes)
- [Reading other services](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#reading-other-services)
- [run and run_script](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md#packagejson)
