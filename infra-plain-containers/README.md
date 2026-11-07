# Plain containers and external ports

A Node app that logs in with OpenID Connect against a mock provider, where each lane runs its own provider. Both containers are `infra.containers` entries, without a Compose file: the provider with `per_lane: true` and a hostname from `infra.hosts`, and a whoami container that every lane shares. `devlanes.local.example.yaml` adds a docs server you start yourself, routed through `infra.external`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 24 and npm 11
- Docker

## Run it

```sh
cd infra-plain-containers
devlanes start
```

Open https://plain-containers.localhost. The page shows lane 0 of `plain-containers`, the issuer of the lane's OIDC provider and the hostname of the shared whoami container. The login button goes to the provider's login form at `https://auth.plain-containers.localhost/default/authorize`; enter any username and you come back to the page with the ID token's claims (`sub`, `iss`, `preferred_username`, `email`, `roles`). `/lane` returns the lane's values as JSON.

## During a start

The first start of lane 0, with `devlanes start --no-ui --output plain`:

```text
ok infra
ok install
plain-containers@0 · main
ok services  1 of 1 ready
  ok  web  https://plain-containers.localhost
```

1. Infra: devlanes runs two containers bound to 127.0.0.1. `devlanes-plain-containers-lane0-oidc` is lane 0's own provider (`ghcr.io/navikt/mock-oauth2-server:6.1.1`) with `oidc.json` bind-mounted read-only; `devlanes-plain-containers-whoami` has no `per_lane`, so there is one for the whole project. Each named port in `ports` gets a host port, read as `${{ infra.oidc.ports.http }}` and `${{ infra.whoami.ports.http }}`. The start waits for each container's `ready.http` check: `/isalive` on the provider, `/health` on whoami.
2. `lane.create` tasks: `install` runs `npm ci`.
3. Services: `web` starts with `OIDC_ISSUER`, `OIDC_PORT` and `WHOAMI_URL` from `global_env` and `PUBLIC_URL` from `${{ self.public_url }}`, and is ready when `/healthz` answers.

`infra.hosts` routes `auth.plain-containers.localhost` to the provider's `http` port. The provider names its issuer after the host and scheme each request came in with. The devlanes proxy keeps the `Host` header and sends `X-Forwarded-Proto: https`, so through the proxy the issuer is `https://auth.plain-containers.localhost/default`. That is the issuer the browser logs in at, so `server.mjs` uses the same hostname for discovery and the code exchange (with [openid-client](https://github.com/panva/openid-client)), over HTTPS trusted through the `NODE_EXTRA_CA_CERTS` devlanes sets for Node. On its host port the same provider names another issuer, and the ID token's `iss` would follow it:

```sh
curl -s http://127.0.0.1:20571/default/.well-known/openid-configuration
```

```text
{
  "issuer" : "http://127.0.0.1:20571/default",
  "authorization_endpoint" : "http://127.0.0.1:20571/default/authorize",
```

`devlanes infra status` prints the host port to use in place of `20571`. The callback goes to `PUBLIC_URL` plus `/callback`, so each lane's provider sends the browser back to that lane's app.

The `lane`, `branch`, `service` and `port` rows on the page come from `DEVLANES_LANE`, `DEVLANES_LANE_NAME`, `LANE_LABEL`, `DEVLANES_SERVICE` and `PORT`, `url` from the `X-Forwarded-Host` header the proxy sends, the provider rows from the discovery document, and the whoami hostname from `GET $WHOAMI_URL/api`.

## Try next

- Start a second lane in a worktree: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/infra-plain-containers && devlanes start`. This step was not run when the example was written. From the same folder, `devlanes lane new --name plain-containers-review --start` gives a second lane without a worktree:

  ```text
  ok infra
  ok install
  created plain-containers@1 named plain-containers-review (main) at D:\dev\devlanes\examples
  plain-containers@1 · main
  ok services  1 of 1 ready
    ok  web  https://plain-containers1.localhost
  ```

  Lane 1 at https://plain-containers1.localhost logs in at `https://auth.plain-containers1.localhost/default/authorize`, and its ID token has `"iss": "https://auth.plain-containers1.localhost/default"`. The whoami card shows the same URL and hostname in both lanes.

- List the containers. Each lane has its own provider, and whoami appears once:

  ```sh
  docker ps --filter label=dev.devlanes.project=plain-containers --format '{{.Names}}\t{{.Ports}}'
  ```

  ```text
  devlanes-plain-containers-lane1-oidc	127.0.0.1:20541->8080/tcp
  devlanes-plain-containers-whoami	127.0.0.1:20642->80/tcp
  devlanes-plain-containers-lane0-oidc	127.0.0.1:20571->8080/tcp
  ```

- Route a server only you run. Copy the local file and start the docs server as a unit of the lane:

  ```sh
  cp devlanes.local.example.yaml devlanes.local.yaml
  devlanes exec --name docs-server -- node docs-server.mjs 4800
  ```

  devlanes reads the new file on its own and routes the entry right away. `devlanes status` lists it with its fixed port:

  ```text
  docs         external          4800   –     –          https://docs.plain-containers.localhost
  ```

  https://docs.plain-containers.localhost and https://docs.plain-containers1.localhost both reach the one `docs-server` process, and its page names the hostname each request came in on. The page's branch row shows `-`, because commands run with `devlanes exec` do not get `LANE_LABEL` from `global_env` in devlanes 0.11.3. The lane line in `devlanes status` also says `config changed: infra changed`; `devlanes reload` clears it by restarting the whole lane (`warn infra or ports changed, so the whole lane restarted`) and reuses both containers.

  `devlanes stop docs-server` stops the server. Its hostnames then answer with the proxy's `DL301 Service not listening` page (503) until you delete `devlanes.local.yaml`, which removes the routes.

- `devlanes stop` stops `web` only. Both containers keep running, and the next `devlanes start` reuses them.

- `devlanes lane clean plain-containers-review --yes` prints `cleaned plain-containers@1: stopped 1 unit` and removes lane 1's provider. The `docker ps` command above then lists `devlanes-plain-containers-whoami` and `devlanes-plain-containers-lane0-oidc`, and lane 0 keeps running.

- To remove everything: `devlanes lane clean 0 --yes`, which removes lane 0's provider, then `docker rm -f devlanes-plain-containers-whoami` for the shared container, which `lane clean` leaves in place. Delete `devlanes.local.yaml` if you created it.

## Files

- `devlanes.yaml`: the per-lane `oidc` container with its `auth.` hostname, the shared `whoami` container, the issuer and whoami URL in `global_env`, `install` and the `web` service.
- `devlanes.local.example.yaml`: `infra.external.docs` at `127.0.0.1:4800` with a `docs.` hostname in every lane; copy it to `devlanes.local.yaml`.
- `oidc.json`: the provider's config, mounted into each lane's container: the login form and the claims it adds to every token.
- `server.mjs`: the app (`/`, `/login`, `/callback`, `/logout`, `/lane`, `/healthz`).
- `docs-server.mjs`: the docs server, listening on the port given as its argument.
- `devlanes.css`, `logo.svg`: the devlanes look for the pages.

## Docs

- [Infra: plain containers and external ports](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/infra.md)
- [Local overrides](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#local-overrides)
- [Config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md)
