# devlanes examples

Runnable projects for [devlanes](https://github.com/devlanes-run/devlanes). Each folder has its own `devlanes.yaml` and is a separate devlanes project named `example-<name>`, so you can start one example or several at once, and every Git worktree of this repository runs its own lane of each. The examples double as a test bed for devlanes itself, locally or on a remote box.

## Requirements

- devlanes ([install](https://github.com/devlanes-run/devlanes#install)), then `devlanes setup` once so browsers and `curl` trust the HTTPS hostnames
- Git with symbolic links enabled: every example links to the shared CSS and logo in `_internal/brand`. macOS and Linux need nothing. On Windows, turn on Developer Mode and clone with `git clone -c core.symlinks=true ...`.
- What each example lists under Requirements: Node, Docker, uv, Rust and so on

## Run an example

```sh
git clone https://github.com/devlanes-run/examples
cd examples/basics-hello-node
devlanes start
```

`devlanes start` opens the TUI on the lane and follows the start. Open https://example-hello-node.localhost to see which lane, branch, service and port answered. `devlanes stop` stops the lane, and `devlanes lane clean 0 --yes` also removes its data.

## A second lane

A worktree is a lane. Add one and start the same example there:

```sh
git worktree add ../examples-checkout -b feat/checkout
cd ../examples-checkout/basics-hello-node
devlanes start
```

Both lanes run side by side, each with its own ports and hostnames (`example-hello-node.localhost` and `example-hello-node1.localhost`). The TUI lists both, and `devlanes url ls` prints every routed hostname on the machine.

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

`catalog.json` lists every example and generates the tables below. Status is `planned` until the example runs as its README describes.

<!-- catalog:start -->

### Basics

| Example                                    | What it teaches                                                                                                             | Needs      | Status |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| [basics-hello-node](basics-hello-node)     | Run one TypeScript server per worktree: devlanes gives it a port, an HTTPS hostname and a ready check.                      | node       | ready  |
| [basics-ready-checks](basics-ready-checks) | Pick the right ready check for each service: http, tcp, log and cmd, including apps that answer only on their own hostname. | node, curl | ready  |

### Web

| Example                                      | What it teaches                                                                                                                                                       | Needs | Status |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------ |
| [web-frontend-api](web-frontend-api)         | Connect a React frontend to its API per lane: public_url for the browser, url for server-to-server calls, CORS from DEVLANES_ORIGINS and a cookie on the lane domain. | node  | ready  |
| [web-next-app](web-next-app)                 | Run Next.js per lane with the next preset, and fetch an HTTPS sibling API from a server component without TLS workarounds.                                            | node  | ready  |
| [web-realtime-ws](web-realtime-ws)           | Serve WebSockets and server-sent events through the proxy, with extra named ports routed to their own hostnames.                                                      | node  | ready  |
| [web-wildcard-tenants](web-wildcard-tenants) | Serve tenant subdomains on a site with its own cookies, behind a fallback wildcard gateway and an exact short-link host.                                              | node  | ready  |
| [web-provider-stubs](web-provider-stubs)     | Replace third-party SMS and email providers with local fakes per lane, so each lane's messages land in its own inbox.                                                 | node  | ready  |

### Languages

| Example                                              | What it teaches                                                                                                                                  | Needs                                 | Status  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ------- |
| [languages-python-fastapi](languages-python-fastapi) | Run FastAPI under uv behind the HTTPS proxy, with forwarded headers, Jinja pages and HTTPS calls trusted through SSL_CERT_FILE.                  | uv                                    | ready   |
| [languages-rust-axum](languages-rust-axum)           | Run a Cargo workspace of Rust services with run_script on Cargo.toml, a ready timeout for the first build, and reqwest trusting the devlanes CA. | rust                                  | ready   |
| languages-polyglot                                   | Run Node, Bun, Deno, Python and Rust services in one lane through every run_script runner.                                                       | node, bun, deno, uv, rust, just, make | planned |

### Frameworks

| Example                                                    | What it teaches                                                                                                                                                              | Needs             | Status  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------- |
| [frameworks-wrangler-workers](frameworks-wrangler-workers) | Run two Workers per lane with the wrangler preset: a service binding resolved through the lane's own dev registry, KV state in the lane data folder and inspector hostnames. | node              | ready   |
| [frameworks-cloudflare-vite](frameworks-cloudflare-vite)   | Run a React app and a Worker in one Vite server per lane, with the inspector port and persisted state taken from devlanes.                                                   | node              | ready   |
| frameworks-tauri-desktop                                   | Run a Tauri 2 app per lane with its own identifier per lane and replica, against a Vite frontend devlanes runs.                                                              | node, rust, tauri | planned |

### Infra

| Example                                            | What it teaches                                                                                                                                                              | Needs        | Status |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ |
| [infra-postgres-shared](infra-postgres-shared)     | Share one Postgres container between lanes with a database per lane, and run setup, migrations, seeds and resets at the right lane events.                                   | node, docker | ready  |
| [infra-postgres-per-lane](infra-postgres-per-lane) | Give each lane its own Postgres container next to a shared Redis, and remove a lane's container and volume with lane clean.                                                  | node, docker | ready  |
| [infra-multi-database](infra-multi-database)       | Share Postgres, Redis, ClickHouse, RabbitMQ and an S3 store across lanes with a namespace per lane that infra.setup creates and lane clean removes, plus a Mailpit per lane. | node, docker | ready  |
| [infra-plain-containers](infra-plain-containers)   | Run containers without Compose, such as a mock OIDC provider per lane, and route a server you start yourself with infra.external.                                            | node, docker | ready  |

### Workflows

| Example                                                  | What it teaches                                                                                                                                                                      | Needs              | Status  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------- |
| [workflows-profiles-tags](workflows-profiles-tags)       | Organise an npm workspace of APIs, web apps and a worker with tags, colours, templates and profiles, including a test profile and one that attaches to lane 0's APIs.                | node               | ready   |
| [workflows-queue-workers](workflows-queue-workers)       | Run port-less worker replicas that finish their job on stop, keep their lane awake and share a queue namespaced per lane.                                                            | node, docker       | ready   |
| [workflows-pnpm-monorepo](workflows-pnpm-monorepo)       | Run a pnpm and turbo workspace with a service per package, build steps at lane creation, lane values in turbo's cache key and a subdirectory project with its own lanes.             | node, pnpm         | ready   |
| [workflows-dev-and-prod](workflows-dev-and-prod)         | Switch a lane between dev servers and a production build with a profile, run a second project file beside it, and keep personal changes in devlanes.local.yaml.                      | node               | ready   |
| [workflows-dotenv](workflows-dotenv)                     | Feed values from a gitignored .env into named variables, share it with new worktrees, and derive every URL and the cookie domain from one domain root.                               | node               | ready   |
| [workflows-mprocs-migration](workflows-mprocs-migration) | Replace mprocs, Caddy and a hand-made port-slot script with devlanes, item by item: per-lane ports and hostnames, profiles instead of copied configs, tasks instead of manual panes. | node               | ready   |
| [workflows-ci-with](workflows-ci-with)                   | Start a lane, run tests against its HTTPS URLs and stop it again with devlanes with, locally and in GitHub Actions.                                                                  | node               | ready   |
| workflows-tool-versions                                  | Pin each lane's tool versions and variables with mise and direnv files in the worktree root.                                                                                         | node, mise, direnv | planned |

### TUI showcase

| Example                                          | What it teaches                                                                                                                                                        | Needs        | Status |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ |
| [showcase-tui-tour](showcase-tui-tour)           | Walk through the devlanes TUI key by key on the stack from the devlanes.run demo: infra, tasks, profiles, a failing service, an ad-hoc unit, the monitor and freezing. | node, docker | ready  |
| [showcase-many-services](showcase-many-services) | Start 40 services at once to see the start gate queue them, and read CPU and memory per unit in status and the monitor.                                                | node         | ready  |
| [showcase-broken](showcase-broken)               | Trigger the failures devlanes reports, from crashes and wrong ports to the proxy's error pages, and read what each one tells you.                                      | node         | ready  |

### Remote boxes

| Example                                | What it teaches                                                                                                                    | Needs                  | Status |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------ |
| [remote-docker-box](remote-docker-box) | Run lanes on a box in a container and use them from your machine: pairing, mirrored hostnames, hidden services and synced folders. | docker                 | ready  |
| [remote-ssh-box](remote-ssh-box)       | Prepare a Linux server as a devlanes box and connect to it over SSH, Tailscale or Cloudflare Tunnel.                               | a linux box, ssh, node | ready  |

<!-- catalog:end -->

## Formatting and building

```sh
npm install # once, for Prettier
./format.sh # Prettier, cargo fmt and ruff over every example; --check only reports
./build.sh  # installs and builds every example; ./build.sh basics-hello-node builds one
```

## Adding an example

[AGENTS.md](AGENTS.md) has the rules every example follows, for people and coding agents alike. [IDEAS.md](IDEAS.md) lists examples for devlanes features that are planned but not shipped.

## License

MIT. See [LICENSE](LICENSE).
