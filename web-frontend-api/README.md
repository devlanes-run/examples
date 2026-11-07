# Frontend and API on one lane domain

A React page served by Vite and a [Hono](https://hono.dev) API, each on its own HTTPS hostname under the lane's domain. It shows `preset: vite`, `hosts` under `${{ lane.domain }}`, a CORS allow-list read from `DEVLANES_ORIGINS`, a session cookie with `Domain=` set to the lane domain, and `services.api.url` next to `services.api.public_url`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.12 or later (tested with Node 24 and npm 11)

## Run it

```sh
cd web-frontend-api
devlanes start
```

`devlanes start --no-ui` prints the start as text instead of opening the TUI:

```text
example-frontend-api@0 (main): 2/2 ready
ready api http://127.0.0.1:20580 https://api.example-frontend-api.localhost
ready web http://127.0.0.1:20581 https://example-frontend-api.localhost
```

Open https://example-frontend-api.localhost. The page says `This is lane 0 of example-frontend-api.` and shows the items it fetched from https://api.example-frontend-api.localhost, the same API reached through `/proxied` on the page's own host, and a Sign in button.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0, named `main`.

1. The first start of a lane runs the `install` task: one `npm install` at the example root installs both workspaces, `apps/api` and `apps/web`.
2. `api` runs `tsx watch src/index.ts` on its `PORT` and counts as ready once `/healthz` answers. It serves https://api.example-frontend-api.localhost.
3. `web` runs `vite` with the flags `preset: vite` adds (`--port <port> --strictPort --host 127.0.0.1`) and serves https://example-frontend-api.localhost. Vite accepts `.localhost` hostnames without `server.allowedHosts`, and HMR reaches the page through the devlanes proxy without any `server.hmr` settings.

The lane card on the page reads `VITE_LANE`, `VITE_LANE_NAME`, `VITE_LANE_LABEL`, `VITE_SERVICE` and `VITE_PORT`, which `devlanes.yaml` sets on `web`, and takes `url` from `window.location.origin`. The API answers `/lane` with the same values and `/` with them plus the items.

## url and public_url

`web` gets the API's address twice:

- `VITE_API_URL: ${{ services.api.public_url }}` is `https://api.example-frontend-api.localhost`. Vite puts `VITE_*` variables into the code it sends to the browser, so this value has to be the hostname: requests to it go through the devlanes proxy, get HTTPS and belong to the lane's site.
- `API_PROXY_TARGET: ${{ services.api.url }}` is `http://127.0.0.1:<port>`. Only Vite's `server.proxy` on this machine uses it, so it skips TLS and the proxy hop. `https://example-frontend-api.localhost/proxied/lane` goes from the browser to Vite to the API without leaving the page's origin, so it needs no CORS.

```sh
devlanes env show web | grep -E "API_URL|API_PROXY|ORIGINS"
```

```text
API_PROXY_TARGET=http://127.0.0.1:20580
DEVLANES_ORIGINS=https://api.example-frontend-api.localhost,http://localhost:20580,http://127.0.0.1:20580,https://example-frontend-api.localhost,http://localhost:20581,http://127.0.0.1:20581
VITE_API_URL=https://api.example-frontend-api.localhost
```

## Cookies and CORS between the hostnames

`example-frontend-api.localhost` and `api.example-frontend-api.localhost` are two origins on one site, `example-frontend-api.localhost`.

The page's `fetch` to the API is cross-origin, so the browser reads the answer only when it carries CORS headers. The API sends `Access-Control-Allow-Origin` only to origins listed in `DEVLANES_ORIGINS`, which devlanes sets on every service to the lane's https origins plus `http://localhost:<port>` and `http://127.0.0.1:<port>` for each service. `Access-Control-Allow-Credentials: true` lets the browser send and store the cookie on those requests.

`POST /api/session` sets `session=...; Domain=example-frontend-api.localhost; Path=/; Secure; SameSite=Lax`, with the domain from `COOKIE_DOMAIN: ${{ lane.domain }}`. The cookie reaches both hostnames, and requests between them are same-site, so `SameSite=Lax` lets it through. The page shows it in `document.cookie` and reads it back with `GET /api/me`. Lane 1's domain is `example-frontend-api1.localhost`, which is another site.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/web-frontend-api && devlanes start`. To stay in this folder instead, run `devlanes lane new --name review --start`. https://example-frontend-api1.localhost shows `This is lane 1 of example-frontend-api.` and loads its items from https://api.example-frontend-api1.localhost.
- Click Sign in on https://example-frontend-api.localhost, then open https://example-frontend-api1.localhost. Lane 1 shows `document.cookie` as `(empty)` and `not signed in`, because `example-frontend-api1.localhost` is not under `example-frontend-api.localhost`. Sign in and Sign out on lane 1 set and clear a cookie of its own, and lane 0 stays signed in.
- Point lane 1's page at lane 0's API with https://example-frontend-api1.localhost/?api=https://api.example-frontend-api.localhost. The cross-origin and cookie cards show `Failed to fetch`, and the browser console says:

  ```text
  Access to fetch at 'https://api.example-frontend-api.localhost/api/items' from origin 'https://example-frontend-api1.localhost' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  ```

  Lane 0's `DEVLANES_ORIGINS` lists only lane 0's origins. The headers show it (on Windows, add `--ssl-revoke-best-effort` to `curl`):

  ```sh
  curl -sS -D - -o /dev/null -H "Origin: https://example-frontend-api1.localhost" https://api.example-frontend-api.localhost/api/items
  ```

  ```text
  HTTP/1.1 200 OK
  access-control-allow-credentials: true
  content-type: application/json
  vary: Origin
  content-length: 216
  date: Sat, 07 Nov 2026 01:01:35 GMT
  via: 1.1 devlanes.run
  ```

  With `Origin: https://example-frontend-api.localhost` the same request also gets `access-control-allow-origin: https://example-frontend-api.localhost`.

- Edit the heading in `apps/web/src/App.tsx` and save. The page updates without reloading, and the browser console logs `[vite] hot updated: /src/App.tsx`.
- When you are done, `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `review` for the lane from `lane new`, or with `1` from the second worktree.

## Files

- `devlanes.yaml`: the `install` task, `api` with its hostname and `COOKIE_DOMAIN`, `web` with `preset: vite` and both API addresses.
- `apps/api/src/`: the Hono API. `app.ts` mounts the routes, `cors.ts` builds the allow-list from `DEVLANES_ORIGINS`, `routes/session.ts` sets the cookie, `env.ts` reads every variable.
- `apps/web/vite.config.ts`: the `/proxied` route to `API_PROXY_TARGET` and `resolve.preserveSymlinks` for the brand link.
- `apps/web/src/`: the page. `api.ts` makes the calls, `env.ts` reads the `VITE_*` values, `components/` holds `LaneCard`, `ItemsList`, `ProxiedLane` and `SessionPanel`.
- `apps/web/brand`: a link to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [Service patterns: frontend and API](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#frontend-and-api)
- [Hostnames and HTTPS: a site of its own](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#a-site-of-its-own)
- [Framework presets: Vite](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#vite)
- [Ports and environment: reading other services](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#reading-other-services)
