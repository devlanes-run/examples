# Wildcard tenants

A small multi-tenant product as four Hono services in one npm workspace. Tenant pages answer on a wildcard hostname under a `domain()` site of their own (`lanes.vars`), a gateway catches every other subdomain of the lane with `hosts[].fallback: true`, and the exact hostnames `app.` and `go.` win over both.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (tested with Node 24 and npm 11)

## Run it

```sh
cd web-wildcard-tenants
devlanes start
```

On a terminal, `devlanes start` opens the TUI. `devlanes start --no-ui` prints the start as text instead:

```text
example-wildcard-tenants@0 (main): 4/4 ready
ready app http://127.0.0.1:20540 https://app.example-wildcard-tenants.localhost
ready sites http://127.0.0.1:20543
ready gateway http://127.0.0.1:20541
ready links http://127.0.0.1:20542 https://go.example-wildcard-tenants.localhost
```

Open https://app.example-wildcard-tenants.localhost. The page says `This is lane 0 of example-wildcard-tenants.`, sets a session cookie and links to the tenant pages, the short links and a subdomain no service claims.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0.

1. The first start of a lane runs the `install` task (`npm install` at the example root), which installs every workspace under `apps/` and `packages/`.
2. devlanes computes the lane var `sites_domain` from `domain('example-wildcard-sites')`: `example-wildcard-sites.localhost` in lane 0, `example-wildcard-sites1.localhost` in lane 1.
3. It starts the four services with `run_script`, each from its own `apps/<service>/package.json`, and waits for `/healthz` on each.
4. The proxy routes the hostnames:

| Hostname                                 | Service   | Route                          |
| ---------------------------------------- | --------- | ------------------------------ |
| `app.example-wildcard-tenants.localhost` | `app`     | exact                          |
| `go.example-wildcard-tenants.localhost`  | `links`   | exact                          |
| `*.example-wildcard-sites.localhost`     | `sites`   | wildcard                       |
| `*.example-wildcard-tenants.localhost`   | `gateway` | wildcard with `fallback: true` |

`app` sets `session=...; Domain=example-wildcard-tenants.localhost`, so the browser sends the cookie to every name under the lane domain, `go.` and the gateway's subdomains included. Tenant pages sit under `example-wildcard-sites.localhost`, which is another site, and never get it. `sites` reads the tenant from the `Host` header, `gateway` names the subdomain it got, and `links` redirects `/hello` and `/sale` to alice's and bob's pages. Every service also answers `/healthz`, `/lane` and `/request`, which returns the service, the hostname it got and the `Cookie` header.

Windows 11, macOS 26 and Linux with systemd-resolved answer every `*.localhost` name with loopback, wildcards included, and Chrome, Edge and Firefox do so on any OS. Older macOS, Windows Server and programs that do their own DNS (workerd, musl or pure-Go binaries, containers) do not. The hosts file cannot hold wildcards, so those programs reach `*.example-wildcard-sites.localhost` only through the resolver strategy described in the HTTPS guide.

## Try next

On Windows, add `--ssl-revoke-best-effort` to every `curl` command below.

- Ask each hostname which service answered. Exact names win and the fallback takes any other depth below the lane domain:

  ```sh
  curl -fsS https://app.example-wildcard-tenants.localhost/request
  curl -fsS https://go.example-wildcard-tenants.localhost/request
  curl -fsS https://billing.example-wildcard-tenants.localhost/request
  curl -fsS https://a.b.example-wildcard-tenants.localhost/request
  ```

  ```text
  {"service":"app","host":"app.example-wildcard-tenants.localhost","cookie":null}
  {"service":"links","host":"go.example-wildcard-tenants.localhost","cookie":null}
  {"service":"gateway","host":"billing.example-wildcard-tenants.localhost","cookie":null}
  {"service":"gateway","host":"a.b.example-wildcard-tenants.localhost","cookie":null}
  ```

- Take the app's cookie to the gateway and to a tenant. curl's cookie jar applies `Domain` the way a browser does:

  ```sh
  curl -fsS -c jar.txt -o /dev/null https://app.example-wildcard-tenants.localhost/
  curl -fsS -b jar.txt https://billing.example-wildcard-tenants.localhost/request
  curl -fsS -b jar.txt https://alice.example-wildcard-sites.localhost/request
  rm jar.txt
  ```

  ```text
  {"service":"gateway","host":"billing.example-wildcard-tenants.localhost","cookie":"session=bada74b0b665"}
  {"service":"sites","host":"alice.example-wildcard-sites.localhost","cookie":null}
  ```

  In a browser, open the app, then a tenant link and the `billing.` link: the tenant page says the session was not sent, the gateway page shows it.

- Follow a short link: `curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://go.example-wildcard-tenants.localhost/sale` prints `302 https://bob.example-wildcard-sites.localhost/sale`.

- Request the bare sites domain. A wildcard does not cover its parent, so no route has the name and the TLS handshake fails: `curl -sS https://example-wildcard-sites.localhost/` prints `curl: (35) schannel: next InitializeSecurityContext failed: SEC_E_LOGON_DENIED (0x8009030c) - The logon attempt failed` on Windows.

- `devlanes stop links`, then open https://go.example-wildcard-tenants.localhost/hello. The proxy answers `503` with `DL201 Service not running` instead of handing the name to the gateway, because `go.` is still an exact route. `devlanes start links` brings it back.

- Check that the system resolver handles wildcard names without hosts-file entries: `node -e "require('node:dns').lookup('alice.example-wildcard-sites.localhost', { all: true }, (err, addrs) => console.log(err ?? addrs))"` prints `[ { address: '::1', family: 6 }, { address: '127.0.0.1', family: 4 } ]` on Windows 11.

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/web-wildcard-tenants && devlanes start`. The new worktree is lane 1. (This is the one step not run for this README; `devlanes lane new --name example-wildcard-tenants-review --start` in this folder gives the same lane 1 without a worktree.) `devlanes url ls` then lists both lanes' routes, next to those of your other projects:

  ```text
  ready app.example-wildcard-tenants.localhost -> example-wildcard-tenants@0:app port=20540
  ready *.example-wildcard-sites.localhost -> example-wildcard-tenants@0:sites port=20543
  ready *.example-wildcard-tenants.localhost -> example-wildcard-tenants@0:gateway port=20541 fallback
  ready go.example-wildcard-tenants.localhost -> example-wildcard-tenants@0:links port=20542
  ready app.example-wildcard-tenants1.localhost -> example-wildcard-tenants@1:app port=20530
  ready *.example-wildcard-sites1.localhost -> example-wildcard-tenants@1:sites port=20533
  ready *.example-wildcard-tenants1.localhost -> example-wildcard-tenants@1:gateway port=20531 fallback
  ready go.example-wildcard-tenants1.localhost -> example-wildcard-tenants@1:links port=20532
  ```

  https://app.example-wildcard-tenants1.localhost says `This is lane 1 of example-wildcard-tenants.`, its tenants live under `example-wildcard-sites1.localhost`, and its session cookie never reaches lane 0.

- When you are done, `devlanes lane clean 0 --yes` stops lane 0 and deletes its data and logs. Run it with `1` for the second lane.

## Files

- `devlanes.yaml`: the `sites_domain` lane var, the `install` task and the four services with their hostnames.
- `apps/app/src/session.ts`: sets the session cookie on the lane domain.
- `apps/sites/src/app.tsx`: reads the tenant from `Host`; `views/TenantPage.tsx` shows which cookies arrived.
- `apps/gateway/` and `apps/links/`: the catch-all page and the short-link redirects.
- `packages/shared/`: environment parsing, the lane values, the `/healthz`, `/lane` and `/request` routes, and the `Layout` and `LaneCard` components. The `dev` scripts run it from source through the `development` export condition; `build` compiles it first.
- `apps/*/brand`: links to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [Wildcard hostnames](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#wildcard-hostnames)
- [A site of its own](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#a-site-of-its-own)
- [Programs that cannot resolve *.localhost](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-that-cannot-resolve-localhost)
- [Hostnames on Windows](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/windows.md#hostnames)
- [Run and run_script](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/run-scripts.md)
- [`services.<name>.hosts` in the config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md)
