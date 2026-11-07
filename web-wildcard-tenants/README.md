# Wildcard tenant hostnames

A small multi-tenant product as four Node services with no dependencies. Tenant pages answer on a wildcard hostname under a `domain()` site of their own (`lanes.vars`), a gateway catches every other subdomain of the lane with `hosts[].fallback: true`, and the exact hostnames `app.` and `go.` win over both.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (tested with Node 24); there are no packages to install

## Run it

```sh
cd web-wildcard-tenants
devlanes start
```

Open https://app.wildcard-tenants.localhost. The page shows lane 0 of `wildcard-tenants`, sets a session cookie and links to the tenant pages, the short links and a subdomain no service claims.

## During a start

devlanes computes the lane var `sites_domain` from `domain('wildcard-sites')`: `wildcard-sites.localhost` in lane 0, `wildcard-sites1.localhost` in lane 1. It then starts the four services from the scripts in `package.json`, each ready once `/healthz` answers, and the proxy routes:

| Hostname                         | Service   | Route                          |
| -------------------------------- | --------- | ------------------------------ |
| `app.wildcard-tenants.localhost` | `app`     | exact                          |
| `go.wildcard-tenants.localhost`  | `links`   | exact                          |
| `*.wildcard-sites.localhost`     | `sites`   | wildcard                       |
| `*.wildcard-tenants.localhost`   | `gateway` | wildcard with `fallback: true` |

`app` sets `session=...; Domain=wildcard-tenants.localhost`, so the browser sends the cookie to every name under the lane domain, `go.` and the gateway's subdomains included. Tenant pages sit under `wildcard-sites.localhost`, which is another site, and never get it. `sites` reads the tenant from the `Host` header, `gateway` names the subdomain it got, and `links` redirects `/hello` and `/sale` to alice's and bob's pages. Every service also answers `/healthz`, `/lane` and `/request`, which returns the service, the hostname it got and the `Cookie` header.

Windows 11, macOS 26 and Linux with systemd-resolved answer every `*.localhost` name with loopback, wildcards included, and Chrome, Edge and Firefox do so on any OS. Older macOS, Windows Server and programs that do their own DNS (workerd, musl or pure-Go binaries, containers) do not. The hosts file cannot hold wildcards, so those programs reach `*.wildcard-sites.localhost` only through the resolver strategy described in the HTTPS guide.

## Try next

On Windows, add `--ssl-revoke-best-effort` to every `curl` command below.

- Ask each hostname which service answered. Exact names win and the fallback takes any other depth below the lane domain:

  ```sh
  curl -fsS https://app.wildcard-tenants.localhost/request
  curl -fsS https://go.wildcard-tenants.localhost/request
  curl -fsS https://billing.wildcard-tenants.localhost/request
  curl -fsS https://a.b.wildcard-tenants.localhost/request
  ```

  ```text
  {"service":"app","host":"app.wildcard-tenants.localhost","cookie":null}
  {"service":"links","host":"go.wildcard-tenants.localhost","cookie":null}
  {"service":"gateway","host":"billing.wildcard-tenants.localhost","cookie":null}
  {"service":"gateway","host":"a.b.wildcard-tenants.localhost","cookie":null}
  ```

- Take the app's cookie to the gateway and to a tenant. curl's cookie jar applies `Domain` the way a browser does:

  ```sh
  curl -fsS -c jar.txt -o /dev/null https://app.wildcard-tenants.localhost/
  curl -fsS -b jar.txt https://billing.wildcard-tenants.localhost/request
  curl -fsS -b jar.txt https://alice.wildcard-sites.localhost/request
  rm jar.txt
  ```

  ```text
  {"service":"gateway","host":"billing.wildcard-tenants.localhost","cookie":"session=64bd419c9e72"}
  {"service":"sites","host":"alice.wildcard-sites.localhost","cookie":null}
  ```

  In a browser, open the app, then a tenant link and the `billing.` link: the tenant page says the session was not sent, the gateway page shows it.

- Follow a short link: `curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://go.wildcard-tenants.localhost/sale` prints `302 https://bob.wildcard-sites.localhost/sale`.

- Request the bare sites domain. A wildcard does not cover its parent, so no route has the name and the TLS handshake fails: `curl -sS https://wildcard-sites.localhost/` prints `curl: (35) schannel: next InitializeSecurityContext failed: SEC_E_LOGON_DENIED (0x8009030c) - The logon attempt failed` on Windows.

- `devlanes stop links`, then open https://go.wildcard-tenants.localhost/hello. The proxy answers `503` with `DL201 Service not running` instead of handing the name to the gateway, because `go.` is still an exact route. `devlanes start links` brings it back.

- Check that the system resolver handles wildcard names without hosts-file entries: `node -e "require('node:dns').lookup('alice.wildcard-sites.localhost', { all: true }, (err, addrs) => console.log(err ?? addrs))"` prints `[ { address: '::1', family: 6 }, { address: '127.0.0.1', family: 4 } ]` on Windows 11.

- Start a second lane of this folder with `devlanes lane new --name review --start` (a second Git worktree gets one the same way with `devlanes start`). `devlanes url ls` then lists both lanes' routes:

  ```text
  app.wildcard-tenants.localhost            ->  wildcard-tenants@0:app         20460  ready
  *.wildcard-sites.localhost                ->  wildcard-tenants@0:sites       20463  ready
  *.wildcard-tenants.localhost (fallback)   ->  wildcard-tenants@0:gateway     20461  ready
  go.wildcard-tenants.localhost             ->  wildcard-tenants@0:links       20462  ready
  app.wildcard-tenants1.localhost           ->  wildcard-tenants@1:app         20580  ready
  *.wildcard-sites1.localhost               ->  wildcard-tenants@1:sites       20583  ready
  *.wildcard-tenants1.localhost (fallback)  ->  wildcard-tenants@1:gateway     20581  ready
  go.wildcard-tenants1.localhost            ->  wildcard-tenants@1:links       20582  ready
  ```

  https://app.wildcard-tenants1.localhost shows lane 1, its tenants live under `wildcard-sites1.localhost`, and its session cookie never reaches lane 0. `devlanes lane clean review --yes` removes the lane.

## Files

- `devlanes.yaml`: the `sites_domain` lane var and the four services with their hostnames.
- `package.json`: one script per service.
- `services/app.mjs`: the product page; sets the session cookie on the lane domain.
- `services/sites.mjs`: tenant pages; reads the tenant from `Host` and shows which cookies arrived.
- `services/gateway.mjs`: the catch-all page naming the subdomain.
- `services/links.mjs`: short codes redirecting to tenant pages.
- `lib/shared.mjs`: `/healthz`, `/lane`, `/request` and the page layout the services share.
- `public/`: `devlanes.css` and `logo.svg` from `_template`.

## Docs

- [Wildcard hostnames](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#wildcard-hostnames)
- [A site of its own](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#a-site-of-its-own)
- [Programs that cannot resolve *.localhost](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/https.md#programs-that-cannot-resolve-localhost)
- [Hostnames on Windows](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/windows.md#hostnames)
- [`services.<name>.hosts` in the config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md)
