# Frontend and API on one lane domain

A React page served by Vite and a Node API, each on its own HTTPS hostname under the lane's domain. It shows `preset: vite`, `hosts` under `${{ lane.domain }}`, a CORS allow-list read from `DEVLANES_ORIGINS`, a session cookie with `Domain=` set to the lane domain, and `services.api.url` next to `services.api.public_url`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.12 or newer with npm (tested with Node 24 and npm 11)

## Run it

```sh
cd web-frontend-api
devlanes start
```

Open https://frontend-api.localhost. Each Git worktree of this repository is a lane with its own ports and hostnames, and the primary worktree is lane 0. The page shows lane 0 of `frontend-api`, the items it fetched from https://api.frontend-api.localhost, the same API reached through `/proxied` on the page's own host, and a Sign in button.

## During a start

1. The `install` task runs `npm install` in `web/` on the lane's first start (`when: lane.create`). The API uses only `node:http` and has nothing to install.
2. `api` runs `node --watch server.mjs` on its `PORT` and counts as ready once `/healthz` answers. It serves https://api.frontend-api.localhost.
3. `web` runs `vite` with the flags `preset: vite` adds (`--port <port> --strictPort --host 127.0.0.1`) and serves https://frontend-api.localhost. Vite accepts `.localhost` hostnames without `server.allowedHosts`, and HMR reaches the page through the devlanes proxy without any `server.hmr` settings.

The lane card on the page reads `VITE_LANE`, `VITE_LANE_NAME`, `VITE_LANE_LABEL`, `VITE_SERVICE` and `VITE_PORT`, which `devlanes.yaml` sets on `web`, and takes `url` from `window.location.origin`.

## url and public_url

`web` gets the API's address twice:

- `VITE_API_URL: ${{ services.api.public_url }}` is `https://api.frontend-api.localhost`. Vite puts `VITE_*` variables into the code it sends to the browser, so this value has to be the hostname: requests to it go through the devlanes proxy, get HTTPS and belong to the lane's site.
- `API_PROXY_TARGET: ${{ services.api.url }}` is `http://127.0.0.1:<port>`. Only Vite's `server.proxy` on this machine uses it, so it skips TLS and the proxy hop. `https://frontend-api.localhost/proxied/lane` goes from the browser to Vite to the API without leaving the page's origin, so it needs no CORS.

```sh
devlanes env show web | grep -E "API_URL|API_PROXY|ORIGINS"
```

```text
API_PROXY_TARGET=http://127.0.0.1:20480
DEVLANES_ORIGINS=https://api.frontend-api.localhost,http://localhost:20480,http://127.0.0.1:20480,https://frontend-api.localhost,http://localhost:20481,http://127.0.0.1:20481
VITE_API_URL=https://api.frontend-api.localhost
```

## Cookies and CORS between the hostnames

`frontend-api.localhost` and `api.frontend-api.localhost` are two origins on one site, `frontend-api.localhost`.

The page's `fetch` to the API is cross-origin, so the browser reads the answer only when it carries CORS headers. The API sends `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true` only to origins listed in `DEVLANES_ORIGINS`, which devlanes sets on every service to the lane's https origins plus `http://localhost:<port>` and `http://127.0.0.1:<port>` for each service.

`POST /api/session` sets `session=...; Domain=frontend-api.localhost; Path=/; SameSite=Lax; Secure`, with the domain from `COOKIE_DOMAIN: ${{ lane.domain }}`. The cookie reaches both hostnames, and requests between them are same-site, so `SameSite=Lax` lets it through. The page shows it in `document.cookie` and reads it back with `GET /api/me`. Lane 1's domain is `frontend-api1.localhost`, which is another site.

## Try next

- Start a second lane in the same folder with `devlanes lane new --name review --start` (a second worktree also gets its own lane). https://frontend-api1.localhost shows `This is lane 1 of frontend-api.` and loads its items from https://api.frontend-api1.localhost.
- Click Sign in on https://frontend-api.localhost, then open https://frontend-api1.localhost. Lane 1 shows `document.cookie` as `(empty)` and `not signed in`, because `frontend-api1.localhost` is not under `frontend-api.localhost`. Sign in and Sign out on lane 1 set and clear a cookie of its own, and lane 0 stays signed in.
- Point lane 1's page at lane 0's API with https://frontend-api1.localhost/?api=https://api.frontend-api.localhost. The cross-origin and cookie cards show `Failed to fetch`, and the browser console says:

  ```text
  Access to fetch at 'https://api.frontend-api.localhost/api/items' from origin 'https://frontend-api1.localhost' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  ```

  Lane 0's `DEVLANES_ORIGINS` lists only lane 0's origins. The headers show it (on Windows, add `--ssl-revoke-best-effort` to `curl`):

  ```sh
  curl -sS -D - -o /dev/null -H "Origin: https://frontend-api1.localhost" https://api.frontend-api.localhost/api/items
  ```

  ```text
  HTTP/1.1 200 OK
  vary: Origin
  content-type: application/json; charset=utf-8
  date: Fri, 06 Nov 2026 20:39:38 GMT
  via: 1.1 devlanes.run
  transfer-encoding: chunked
  ```

  With `Origin: https://frontend-api.localhost` the same request also gets `access-control-allow-origin: https://frontend-api.localhost` and `access-control-allow-credentials: true`.
- Edit a heading in `web/src/App.jsx` and save. The page updates without reloading, and the browser console logs `[vite] hot updated: /src/App.jsx`.
- Remove both lanes with `devlanes lane clean review --yes` and `devlanes lane clean 0 --yes`.

## Files

- `devlanes.yaml`: the `install` task, `api` with its hostname and `COOKIE_DOMAIN`, `web` with `preset: vite` and both API addresses.
- `api/server.mjs`: the API on `node:http`, with CORS from `DEVLANES_ORIGINS`, the session cookie, `/api/items`, `/api/me`, `/lane` and `/healthz`.
- `web/vite.config.js`: the `/proxied` route to `API_PROXY_TARGET`.
- `web/src/App.jsx`: the page.
- `web/src/devlanes.css` and `web/public/logo.svg`: the devlanes look, copied from `_template`.

## Docs

- [Service patterns: frontend and API](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#frontend-and-api)
- [Hostnames and HTTPS: a site of its own](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#a-site-of-its-own)
- [Framework presets: Vite](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/presets.md#vite)
- [Ports and environment: reading other services](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#reading-other-services)
