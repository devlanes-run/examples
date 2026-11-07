# devlanes examples

Runnable projects for [devlanes](https://github.com/devlanes-run/devlanes). Each folder has its own `devlanes.yaml` and is a separate devlanes project, so you can start one example or several at once, and every Git worktree of this repository runs its own lane of each. The examples double as a test bed for devlanes itself, locally or on a remote box.

## Requirements

- devlanes ([install](https://github.com/devlanes-run/devlanes#install)), then `devlanes setup` once so browsers and `curl` trust the HTTPS hostnames
- Git
- What each example lists under Requirements: Node, Docker, uv, Rust and so on

## Run an example

```sh
git clone https://github.com/devlanes-run/examples
cd examples/basics-hello-node
devlanes start
```

`devlanes start` opens the TUI on the lane and follows the start. Open https://hello-node.localhost to see which lane, branch, service and port answered. An example's project name is its folder name without the category, so its hostnames stay short. `devlanes stop` stops the lane, and `devlanes lane clean 0 --yes` also removes its data.

## A second lane

A worktree is a lane. Add one and start the same example there:

```sh
git worktree add ../examples-checkout -b feat/checkout
cd ../examples-checkout/basics-hello-node
devlanes start
devlanes url ls
```

Both lanes run side by side, each with its own ports and hostnames (`hello-node.localhost` and `hello-node1.localhost`). The TUI lists both, and `devlanes url ls` prints every routed hostname on the machine.

Without a worktree, `devlanes lane new --name hello-node-review --start` adds a second lane to the same folder. Every example in a checkout shares that folder's lane names, so give each example's extra lane its own name.

## On a remote box

Clone this repository on the box, start an example there, and connect from your machine:

```sh
# on the box
git clone https://github.com/devlanes-run/examples
cd examples/basics-hello-node && devlanes start --no-ui
devlanes daemon pair

# on your machine
devlanes remote connect my-box --code XXXX-XXXX
```

The box's hostnames then open in your local browser. [remote-docker-box](remote-docker-box) does the same with a container as the box, and the [remote setup guide](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/remote-setup.md) covers SSH, Tailscale and Cloudflare.

## Examples

Status is `planned` until the example runs as its README describes.

### Basics

| Example | Shows | Needs | Status |
| --- | --- | --- | --- |
| [basics-hello-node](basics-hello-node) | One Node server with no dependencies: `PORT`, `hosts`, an `http` ready check, two worktrees | Node | ready |
| [basics-ready-checks](basics-ready-checks) | One service per `ready` kind: `http`, `tcp`, `log`, `http.host` and `cmd` for an app that answers only on its own hostname, `host_header: upstream`, a slow start and a check that times out | Node, curl | ready |

### Web

| Example | Shows | Needs | Status |
| --- | --- | --- | --- |
| [web-frontend-api](web-frontend-api) | React frontend and Node API: `preset: vite`, CORS from `DEVLANES_ORIGINS`, a cookie on the lane domain, `public_url` for the browser and `url` for Vite's `server.proxy` | Node | ready |
| [web-next-app](web-next-app) | Next.js with `preset: next`, a server component fetching an HTTPS sibling through `NODE_EXTRA_CA_CERTS` and over `url`, route handlers for `/lane` and `/healthz`, a build folder per lane | Node | ready |
| [web-realtime-ws](web-realtime-ws) | SSE and WebSockets through the proxy on any route, named ports with `self.ports.<name>` routed by `hosts[].port`, a frozen lane thawed by a WebSocket message | Node | ready |
| [web-wildcard-tenants](web-wildcard-tenants) | Tenant subdomains on a `domain()` site with its own cookies, a gateway with a `fallback` wildcard, a short-link hostname that wins over it | Node | ready |
| [web-provider-stubs](web-provider-stubs) | Fake SMS and email provider APIs per lane with inbox pages, an API calling them over HTTPS through `services.<stub>.public_url`, a tag colour, and the proxy's 503 reaching the client | Node | ready |

### Languages

| Example | Shows | Needs | Status |
| --- | --- | --- | --- |
| [languages-python-fastapi](languages-python-fastapi) | FastAPI under uv with `--proxy-headers`, server-rendered Jinja pages, HTTPS calls trusted through `SSL_CERT_FILE`, `run_script` on `pyproject.toml`, CORS from `DEVLANES_ORIGINS`, `uv sync` on `lane.create` | uv, Python 3.12 | ready |
| [languages-rust-axum](languages-rust-axum) | Two axum binaries through `run_script` on `Cargo.toml` sharing one `target/`, a long first-build ready timeout, reqwest with native roots trusting the CA through `SSL_CERT_FILE` | Rust | ready |
| [languages-polyglot](languages-polyglot) | Node, Bun, Deno, Python and Rust services in one lane calling each other, every `run_script` runner (package.json, deno.json, pyproject.toml, Cargo.toml, justfile, Makefile) | Node, Bun, Deno, uv, Rust, just, make | planned |

### Frameworks

| Example | Shows | Needs | Status |
| --- | --- | --- | --- |
| [frameworks-wrangler-workers](frameworks-wrangler-workers) | Two Cloudflare Workers with a service binding resolved through the per-lane dev registry, `preset: wrangler` from a template, `wrangler.vars` for lane values, KV state under `lane.data_path` with `--persist-to`, inspector hostnames with `port: inspector`, `lanes.hosts_file: always` | Node | ready |
| [frameworks-cloudflare-vite](frameworks-cloudflare-vite) | A React page and a Worker in one Vite through `@cloudflare/vite-plugin`: `preset: vite`, the inspector port from `self.ports.inspector` routed with `host_header: upstream`, state persisted under the lane data folder, the dev registry variables | Node | ready |
| [frameworks-tauri-desktop](frameworks-tauri-desktop) | Tauri 2 with `preset: tauri`, an identifier per lane and replica, `replicas: 2`, a Vite frontend devlanes runs | Node, Rust, Tauri system dependencies | planned |

### Infra

| Example | Shows | Needs | Status |
| --- | --- | --- | --- |
| [infra-postgres-shared](infra-postgres-shared) | One Postgres for every lane with a database per lane: `infra.setup`, `infra.teardown`, `migrate` on `lane.start`, `seed` after services, `reset-db` with `steps` and `confirm` | Node, Docker | ready |
| [infra-postgres-per-lane](infra-postgres-per-lane) | `infra.per_lane` Postgres next to a shared Redis with a database index per lane, setup through `$DEVLANES_COMPOSE_LANE_PROJECT`, a frozen lane's paused container; `lane clean` removes the lane's container and volume | Node, Docker | ready |
| [infra-multi-database](infra-multi-database) | A mock-data API over shared Postgres, Redis, ClickHouse, RabbitMQ and an S3 store (RustFS), each namespaced per lane (database, index, vhost, bucket) by `infra.setup` and `infra.teardown`, plus Mailpit per lane and `infra.hosts` for the consoles | Node, Docker | ready |
| [infra-plain-containers](infra-plain-containers) | `infra.containers` without Compose: a mock OIDC provider per lane with `infra.hosts`, so each lane logs in against its own issuer, next to a shared whoami read as `infra.whoami.ports.http`; `infra.external` from `devlanes.local.yaml` for a server started with `devlanes exec` | Node, Docker | ready |

### Workflows

| Example | Shows | Needs | Status |
| --- | --- | --- | --- |
| [workflows-profiles-tags](workflows-profiles-tags) | `tags` with colours, `templates` and `extends`, a display `name`, profiles (`default`, `backend`, `web`, `all` with `exclude`, a `test` profile that moves data files within the same lane, `attach` with `lanes.main.services`), the TUI profile picker, `autostart: false`, a port-less worker with `keep_awake` | Node | ready |
| [workflows-queue-workers](workflows-queue-workers) | An API feeding two port-less worker replicas through a shared Redis with a key prefix per lane: `ready.log`, `replicas` with `replica.index`, `pty: false`, `keep_awake`, `stop.signal: SIGINT` finishing the in-flight job, `infra.teardown` deleting the lane's keys, a `cleanup` task | Node, Docker | ready |
| [workflows-pnpm-monorepo](workflows-pnpm-monorepo) | A pnpm workspace with a `run_script` per package, `install` and `build-deps` on `lane.create`, `templates` with `extends` and `tags`, turbo hashing the lane's `VITE_*` values, a subdirectory project linked through `projects.<name>.services` | Node 24, pnpm 11 | ready |
| [workflows-dev-and-prod](workflows-dev-and-prod) | A `prod` profile in the same lane (`run_scripts: { dev: start }`, `vite preview`, a `build` task with `profiles: [prod]`), `devlanes.prod.yaml` with `extends` as a second project beside the dev one, build output in `lane.data_path`, `devlanes.local.yaml` overrides | Node | ready |
| [workflows-dotenv](workflows-dotenv) | A gitignored `.env` read through `${{ env.X }}` and named in `global_env` (keys it doesn't name stay out), `devlanes reload` after a `.env` edit, new worktrees falling back to the primary one's `.env`, and one domain root for every URL and the cookie domain | Node | ready |
| [workflows-mprocs-migration](workflows-mprocs-migration) | `mprocs.yaml`, Caddy and a port-slot script next to the `devlanes.yaml` that replaces them: `API_PORT: ${{ self.port }}`, `hosts`, profiles instead of autostart copies, `migrate` and `seed` tasks, a literal-`PORT` stub only one lane can run | Node | ready |
| [workflows-ci-with](workflows-ci-with) | `devlanes with --profile e2e -- npm test` with `node:test` tests reading `DEVLANES_PUBLIC_URL_*`, an `e2e` profile with `run_scripts: { dev: start }`, `--logs-dir`, `exec` and `wait`, and a GitHub Actions workflow on `devlanes-run/action` | Node | ready |
| [workflows-tool-versions](workflows-tool-versions) | `mise.toml` and `.envrc` applied to every unit | Node, mise, direnv | planned |

### TUI showcase

| Example | Shows | Needs | Status |
| --- | --- | --- | --- |
| [showcase-tui-tour](showcase-tui-tour) | The stack from the devlanes.run demo walked through key by key: api, web (Vite) and worker, shared Postgres and Redis with a database and index per lane, Mailpit per lane, `migrate` and `seed` tasks, profiles, an opt-in service that crashes, an ad-hoc `exec` unit, freeze and thaw | Node, Docker | ready |
| [showcase-many-services](showcase-many-services) | 40 services from `generate.mjs` and a few `templates`, tag colours, the start gate queue, `--all-at-once`, `status` CPU and memory, `debug top`, the monitor (`M`) with filter, sort and flat view | Node | ready |
| [showcase-broken](showcase-broken) | Services built to fail: a crash on boot and on request, a missing program, a wrong port, a ready timeout, a proxy loop, a reset and a stray 101, with the DL101, DL104, DL201-203 and DL301-303 pages, and a config typo | Node | ready |

### Remote and agents

| Example | Shows | Needs | Status |
| --- | --- | --- | --- |
| [remote-docker-box](remote-docker-box) | A box in a container reached with `remote.boxes.<name>.command`, pairing with `daemon pair`, mirrored hostnames and ports, a box-only `devlanes.local.yaml` with `hidden` and `sync` | Docker | ready |
| [remote-ssh-box](remote-ssh-box) | `box-setup.sh` preparing a Debian or Ubuntu VPS as a box (devlanes in `~/.devlanes/bin`, linger, its own `ports.range`, pairing), and `ssh_config` entries for plain SSH, Tailscale and Cloudflare Tunnel | A Linux box with glibc 2.35+ and sudo | ready |
| [agents-plugin-hooks](agents-plugin-hooks) | `AGENTS.md` and `CLAUDE.md` with the plugin's devlanes section, the plugin's `PreToolUse` hook in `.claude/settings.json` refusing `npm run dev &`, `exec --name`, `wait`, `with -- npm test`, `stop --mine`, agent and human output | Node, Claude Code or Codex | ready |

## Adding an example

[AGENTS.md](AGENTS.md) has the rules every example follows, for people and coding agents alike. [IDEAS.md](IDEAS.md) lists examples for devlanes features that are planned but not shipped.

## License

MIT. See [LICENSE](LICENSE).
