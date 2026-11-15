# Next.js app with an HTTPS sibling API

A Next.js 16 App Router app run with `preset: next`, next to a small [Hono](https://hono.dev) API, as an npm workspace. The page is a server component that fetches the API twice while it renders: through the API's `public_url` over HTTPS, which works because devlanes sets `NODE_EXTRA_CA_CERTS` for the service, and through its `url` straight to the port.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later

## Run it

```sh
cd web-next-app
devlanes start
```

`devlanes start --no-ui` prints the start as text:

```text
example-next-app@0 (main): 2/2 ready
ready web http://127.0.0.1:20431 https://example-next-app.localhost
ready api http://127.0.0.1:20430 https://api.example-next-app.localhost
```

Open https://example-next-app.localhost. The page says `This is lane 0 of example-next-app.`, lists the values devlanes gave the `web` service, and shows one card per API fetch with its result and time.

## During a start

1. The first start of a lane runs the `install` task. One `npm install` at the workspace root installs both apps.
2. `api` runs `npm run dev` in `apps/api` (`tsx watch src/index.ts`) behind https://api.example-next-app.localhost.
3. `web` runs `npm run dev` in `apps/web`, a plain `next dev`. `preset: next` appends `--port <port> --hostname 127.0.0.1` after a `--`, because the package manager is npm, so the log shows `next dev --port 20431 --hostname 127.0.0.1`. Without `--hostname` Next would listen on `0.0.0.0`.
4. Each service is ready once its `/healthz` answers. `web` gets a 120 s timeout because `next dev` compiles each route on its first request.

## API addresses

`devlanes.yaml` sets `API_PUBLIC_URL` (`https://api.example-next-app.localhost`) from `${{ services.api.public_url }}` and `API_URL` (`http://127.0.0.1:20430`) from `${{ services.api.url }}`, and `apps/web/lib/env.ts` reads them. The page fetches them one after the other. The first request goes through the devlanes proxy, so the API sees `X-Forwarded-Host`; the second goes straight to the port and the API sees no such header. Node trusts the proxy's certificate because devlanes points `NODE_EXTRA_CA_CERTS` at its CA for every Node service. The example sets neither that variable nor `NODE_TLS_REJECT_UNAUTHORIZED`.

## allowedDevOrigins

The [presets guide](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#next) says to set `allowedDevOrigins` when Next warns about cross-origin dev requests. Next 16.4 allows `*.localhost` by default, so the page's own requests pass. A request for a `/_next/static/chunks/` file with `Origin: https://example.invalid` gets a 403, and the log prints `Blocked cross-origin request to Next.js dev resource` with the `allowedDevOrigins` line to add. A lane domain outside `.localhost`, such as one under the resolver strategy's `.test`, needs that line.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/web-next-app && devlanes start`. The new worktree is lane 1, with its own `.next`. Its page at https://example-next-app1.localhost says `This is lane 1 of example-next-app.`, and both API cards report lane 1.
- Run a second lane from the same folder instead: `devlanes lane new --name example-next-app-review`, then `devlanes start --lane example-next-app-review --env NEXT_DIST_DIR=.next/review`. `next dev` locks its output folder, so without the variable the second one exits with `Another next dev server is already running.` `apps/web/next.config.ts` reads `NEXT_DIST_DIR`. `devlanes url ls` lists both lanes:

  ```text
  HOST                                                 TARGET                               PORT   STATE
  example-next-app.localhost                       ->  example-next-app@0:web               20431  ready
  api.example-next-app.localhost                   ->  example-next-app@0:api               20430  ready
  example-next-app1.localhost                      ->  example-next-app@1:web               20551  ready
  api.example-next-app1.localhost                  ->  example-next-app@1:api               20550  ready
  ```

- `devlanes env show web --explain | grep NODE_EXTRA_CA_CERTS` prints the path of `ca.pem` in your devlanes home, with the layer `contributor` (the Node platform) instead of `service` or `global`.
- Take the CA away: `devlanes restart web --env NODE_EXTRA_CA_CERTS=`. Reload the page: the HTTPS card shows `Error: self-signed certificate in certificate chain` while the direct card still answers.
- A plain `devlanes restart web` keeps the `--env` value. `devlanes stop web` and then `devlanes start web` bring the CA back.
- Stop the API with `devlanes stop api` and reload. The HTTPS card shows `HTTP 503 Service Unavailable` from the proxy, and the direct card `Error: connect ECONNREFUSED 127.0.0.1:20430`. `devlanes start api` brings both back.
- `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `example-next-app-review` for the same-folder lane, or with `1` from the second worktree.

## Files

- [`devlanes.yaml`](devlanes.yaml): the `install` task, the `web` service with `preset: next` and both API addresses, and the `api` service.
- [`apps/web/app/`](apps/web/app): the root layout, the page (a server component), and route handlers for `/lane` and `/healthz`.
- [`apps/web/lib/`](apps/web/lib): `env.ts` for the environment, `api.ts` for the fetch with its timeout.
- [`apps/web/next.config.ts`](apps/web/next.config.ts): `NEXT_DIST_DIR` for lanes that share a folder, and `agentRules: false`, which stops `next dev` from writing an `AGENTS.md` when a coding agent runs devlanes.
- [`apps/api/src/`](apps/api/src): the Hono API.

## Docs

- [Framework presets: Next](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#next)
- [Programs started by devlanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-started-by-devlanes)
- [Reading other services](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#reading-other-services)
- [run and run_script](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md#packagejson)
