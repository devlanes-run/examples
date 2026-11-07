# Ideas

Examples and repository work that are not in the catalogue yet. Move an entry into `README.md` once the example exists, and delete it here.

## Examples waiting on devlanes features

These need something devlanes plans but does not ship today.

- MCP server: an agent that lists lanes, reads logs and waits for services through MCP tools instead of the CLI.
- Built-in window streaming: a Linux or Windows desktop app shown in the browser through devlanes itself, without Xpra.
- Relay transport and shareable lane previews: open a lane from another network or send its URL to a reviewer.
- Public hostnames with DNS-01 certificates (`hostnames.base_domain`): an OAuth login against a real provider, and a phone on the LAN opening a lane.
- UDP mirroring: a UDP service (statsd, a DNS stub) used from a machine connected to a box.
- iOS simulator and Android emulator trust stores: a mobile app calling a lane's API over HTTPS.
- Lane index per box and `lane renumber`: several forks of one box image running the same lane numbers.
- Box metrics and remote logs in the TUI: `remote/docker-box` extended to show them.
- Adding replicas to a running lane.
- A secrets provider feeding `global_env`.
- A `platform-go` contributor: a Go service calling an HTTPS sibling without setting `SSL_CERT_FILE` by hand.
- OpenTelemetry traces from the daemon: a collector and Jaeger as infra showing a start.
- Serial start groups for services that need another one first.

## Examples that could be written today

- `gui/xpra-html5`, `gui/ws-scrcpy` and `gui/serve-sim`: GUI tools as ordinary services with a hostname, mirrored from a box.
- `languages/django` and `languages/flask`: `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` from `DEVLANES_ORIGINS`, `ProxyFix`.
- `web/grpc`: a gRPC service reached by port, since the proxy speaks HTTP/1.1 upstream.
- `web/docs-sites`: Storybook and a docs generator without a preset.
- `workflows/two-projects`: two examples that call each other through `projects.<name>.services` with a `default()` fallback.
- `workflows/webhooks`: an `autostart: false` forwarder (Stripe CLI style) with `keep_awake`.
- `remote/several-boxes`: two boxes with the same project and `devlanes remote use`.
- `platforms/windows` and `platforms/wsl`: npm shims, stop signals, paths with spaces, the 8443 fallback and trusting the CA from WSL.
- User config walkthroughs: the resolver strategy with a `.test` TLD, `tls.ca: mkcert`, terminal features, `startup.mode`.

## Repository

- `e2e/`: a harness that runs every `ready` example on each devlanes release. The devlanes e2e crate has the pieces to reuse: a short `DEVLANES_HOME` per test, a `config.yaml` that pins `ports.range` and proxy ports, `curl --resolve --cacert` against the hostnames, and cleanup by PID and Compose project.
- CI on pull requests plus Dependabot (or Renovate) for npm, Cargo, uv, Docker image tags and GitHub Actions, so pinned versions stay current, with CI running the examples a bump touches.
- A minimum devlanes version per example, checked by the e2e harness.
