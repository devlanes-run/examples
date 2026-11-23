<p align="center">
   <b>Using devlanes?</b> Please consider <a href="https://github.com/sponsors/arthurfiorette" target="_blank">donating</a> to support my open source work ❤️
  <br />
  <sup>
   Help devlanes grow! Star and share this amazing repository with your friends and co-workers!
  </sup>
</p>

<br />

<p align="center" title="devlanes">
  <a href="https://devlanes.run" target="_blank" rel="noopener noreferrer">
    <img src="https://devlanes.run/assets/banner.png" alt="devlanes: Sandboxes for your agents. localhost for you." />
  </a>
</p>

<br />

<p align="center">
  <a title="MIT license" target="_blank" href="https://github.com/devlanes-run/examples/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/devlanes-run/examples"></a>
  <a title="Latest devlanes release" target="_blank" href="https://github.com/devlanes-run/devlanes/releases/latest"><img alt="devlanes release" src="https://img.shields.io/github/v/release/devlanes-run/devlanes?label=devlanes"></a>
  <a title="Last commit" target="_blank" href="https://github.com/devlanes-run/examples/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/devlanes-run/examples"></a>
</p>

<br />
<br />

# devlanes examples

> Runnable projects that each show one devlanes feature.

<br />

Small apps that run under [devlanes](https://github.com/devlanes-run/devlanes). Each folder has its own `devlanes.yaml` and is a separate devlanes project named `example-<name>`, so you can start one example or several at once, and every Git worktree of this repository runs its own lane of each. The examples double as a test bed for devlanes itself, locally or on a remote box.

<br />

- [Browse the examples on devlanes.run.](https://devlanes.run/examples/)
- [Read the devlanes docs.](https://devlanes.run/docs/)

<br />

## Requirements

- devlanes ([install](https://devlanes.run/docs/install/)), then `devlanes setup` once so browsers and `curl` trust the HTTPS hostnames
- Git with symbolic links enabled: every example links to the shared CSS and logo in `_internal/brand`. macOS and Linux need nothing. On Windows, turn on Developer Mode and clone with `git clone -c core.symlinks=true ...`.
- What each example lists under Requirements: Node, Docker, uv, Rust and so on

## Run an example

```sh
git clone https://github.com/devlanes-run/examples
cd examples/basics-hello-node
devlanes start
```

`devlanes start` opens the TUI on the lane and follows the start. Open `https://example-hello-node.localhost` to see which lane, branch, service and port answered. `devlanes stop` stops the lane, and `devlanes lane clean 0 --yes` also removes its data.

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

The box's hostnames then open in your local browser. [remote-docker-box](remote-docker-box) does the same with a container as the box, and [Prepare a box](https://devlanes.run/docs/how-to/remote/prepare-a-box/) and the guides next to it cover SSH, Tailscale and Cloudflare.

## Examples

`catalog.json` lists every example and generates the tables below. Status is `planned` until the example runs as its README describes.

<!-- catalog:start -->

### Basics

| Example                                    | What it teaches                                                                        | Needs      | Status |
| ------------------------------------------ | -------------------------------------------------------------------------------------- | ---------- | ------ |
| [basics-hello-node](basics-hello-node)     | Start here: one TypeScript server that gets its port and HTTPS hostname from devlanes. | node       | ready  |
| [basics-ready-checks](basics-ready-checks) | Tell devlanes when each service is up, with an http, tcp, log or cmd ready check.      | node, curl | ready  |

### Languages

| Example                                              | What it teaches                                                                                                            | Needs                                 | Status  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------- |
| [languages-python-fastapi](languages-python-fastapi) | Run a FastAPI app under uv behind the HTTPS proxy, and call other HTTPS services from it.                                  | uv                                    | ready   |
| [languages-rust-axum](languages-rust-axum)           | Run the services of a Cargo workspace, with a ready timeout long enough for the first build.                               | rust                                  | ready   |
| [languages-java-maven](languages-java-maven)         | Run two Spring Boot apps from one Maven multi-module build, one calling the other over HTTPS with the devlanes CA trusted. | java                                  | ready   |
| [languages-go-api](languages-go-api)                 | Run two Go programs from one module, one with go run and one rebuilt by air, and call one from the other over HTTPS.       | go, task                              | ready   |
| languages-polyglot                                   | Run Node, Bun, Deno, Python and Rust services in one lane through every run_script runner.                                 | node, bun, deno, uv, rust, just, make | planned |

### Web

| Example                                      | What it teaches                                                                                                           | Needs | Status |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----- | ------ |
| [web-frontend-api](web-frontend-api)         | Point a React frontend at its lane's API, with CORS and a session cookie that work on the lane's domain.                  | node  | ready  |
| [web-next-app](web-next-app)                 | Run Next.js with the next preset and call an HTTPS API in the same lane from a server component.                          | node  | ready  |
| [web-realtime-ws](web-realtime-ws)           | Serve WebSockets and server-sent events through the proxy, and give a service's second port its own hostname.             | node  | ready  |
| [web-wildcard-tenants](web-wildcard-tenants) | Serve every tenant on its own subdomain with a wildcard host, while exact hostnames and a fallback gateway take the rest. | node  | ready  |
| [web-provider-stubs](web-provider-stubs)     | Swap SMS and email providers for local fakes, so each lane's messages land in its own inbox.                              | node  | ready  |

### Frameworks

| Example                                                    | What it teaches                                                                                                   | Needs             | Status  |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------- | ------- |
| [frameworks-wrangler-workers](frameworks-wrangler-workers) | Run two Cloudflare Workers with the wrangler preset, joined by a service binding that resolves inside the lane.   | node              | ready   |
| [frameworks-cloudflare-vite](frameworks-cloudflare-vite)   | Run a React app and a Worker in one Vite server, with an inspector port and stored state of its own in each lane. | node              | ready   |
| [frameworks-quarkus-gradle](frameworks-quarkus-gradle)     | Run Quarkus dev mode from Gradle with its own Postgres container and debugger port in each lane.                  | java, docker      | ready   |
| frameworks-tauri-desktop                                   | Run a Tauri 2 desktop app with a different identifier in each lane, against a Vite frontend devlanes starts.      | node, rust, tauri | planned |

### Infra

| Example                                            | What it teaches                                                                                                                  | Needs        | Status |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ |
| [infra-postgres-shared](infra-postgres-shared)     | Share one Postgres container between lanes and give each lane its own database, migrated on every start.                         | node, docker | ready  |
| [infra-postgres-per-lane](infra-postgres-per-lane) | Give each lane its own Postgres container while Redis stays shared, and delete a lane's container together with its data.        | node, docker | ready  |
| [infra-multi-database](infra-multi-database)       | Share Postgres, Redis, ClickHouse, RabbitMQ and an S3 store across lanes, with a namespace in each one for every lane.           | node, docker | ready  |
| [infra-plain-containers](infra-plain-containers)   | Run containers without Compose, such as a mock OIDC provider for each lane, and route a hostname to a server you start yourself. | node, docker | ready  |

### Workflows

| Example                                                  | What it teaches                                                                                                             | Needs              | Status  |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------- |
| [workflows-profiles-tags](workflows-profiles-tags)       | Group the seven services of an npm workspace with tags and templates, and start a different set of them with each profile.  | node               | ready   |
| [workflows-queue-workers](workflows-queue-workers)       | Run two replicas of a worker that has no port and finishes the job in hand before it stops.                                 | node, docker       | ready   |
| [workflows-pnpm-monorepo](workflows-pnpm-monorepo)       | Run a pnpm and turbo monorepo with a service for each package, next to a second project in a subdirectory.                  | node, pnpm         | ready   |
| [workflows-dev-and-prod](workflows-dev-and-prod)         | Switch a lane between dev servers and a production build with a profile, and keep personal settings in devlanes.local.yaml. | node               | ready   |
| [workflows-dotenv](workflows-dotenv)                     | Read values from a gitignored .env that every worktree shares, and build each URL from the lane's domain.                   | node               | ready   |
| [workflows-mprocs-migration](workflows-mprocs-migration) | Move a project from mprocs, Caddy and a hand-made port script to devlanes, one piece at a time.                             | node               | ready   |
| [workflows-ci-with](workflows-ci-with)                   | Wrap a test run in devlanes with, which starts a lane, gives the tests its HTTPS URLs and stops it afterwards.              | node               | ready   |
| workflows-tool-versions                                  | Pin each lane's tool versions and variables with mise and direnv files in the worktree root.                                | node, mise, direnv | planned |

### TUI showcase

| Example                                          | What it teaches                                                                                        | Needs        | Status |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------ | ------ |
| [showcase-tui-tour](showcase-tui-tour)           | Walk through the TUI key by key, on the same stack as the demo on devlanes.run.                        | node, docker | ready  |
| [showcase-many-services](showcase-many-services) | Start 40 services at once and watch the start gate queue them, with CPU and memory shown for each one. | node         | ready  |
| [showcase-broken](showcase-broken)               | Break services on purpose and read what devlanes and the proxy's error pages say about each failure.   | node         | ready  |

### Remote boxes

| Example                                | What it teaches                                                                                        | Needs                  | Status |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------- | ------ |
| [remote-docker-box](remote-docker-box) | Run lanes on a box inside a Docker container and open them from your machine under the same hostnames. | docker                 | ready  |
| [remote-ssh-box](remote-ssh-box)       | Prepare a Linux server as a devlanes box and connect to it over SSH, Tailscale or Cloudflare Tunnel.   | a linux box, ssh, node | ready  |

### GUI apps

| Example                              | What it teaches                                                                                                                               | Needs                         | Status  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------- |
| [gui-react-native](gui-react-native) | Run Metro on each lane's own port next to an API, and build the React Native app for the Android emulator or iOS simulator against that lane. | node, android sdk, jdk, xcode | planned |

<!-- catalog:end -->

## Formatting and building

```sh
npm install # once, for Prettier
./format.sh # Prettier, cargo fmt and ruff over every example; --check only reports
./build.sh  # installs and builds every example; ./build.sh basics-hello-node builds one
```

## Contributing

To add an example, start with [AGENTS.md](AGENTS.md), which has the rules every example follows, for people and coding agents alike. [IDEAS.md](IDEAS.md) lists examples for devlanes features that are planned but not shipped.

## License

Licensed under the **MIT License**. See [`LICENSE`](https://github.com/devlanes-run/examples/blob/main/LICENSE) for more information.
