# Working in this repository

Each top-level folder named `<category>-<name>` (`basics-hello-node`, `infra-multi-database`) is one runnable example and one devlanes project. An example exists to show a devlanes feature working in a small, real app, and to let maintainers exercise that feature before a release. People clone this repository on their own machine or on a remote box and run examples from it, so every example has to work from a fresh clone with only the tools its README lists.

The devlanes docs are the authority on config keys and commands: [config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md), [CLI reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/cli.md) and the [guides](https://github.com/devlanes-run/devlanes/tree/main/docs/guides). Never invent a key, flag, variable or output line. If an example needs something devlanes does not do, leave it out and add a line to `IDEAS.md`.

## Layout

```
README.md            catalogue of examples, how to run them
AGENTS.md            this file
IDEAS.md             examples waiting on devlanes features, and repository ideas
_template/           README.md, devlanes.css and logo.svg to copy into a new example
<category>-<name>/   one example: devlanes.yaml, README.md, app code, lockfiles
```

Every example sits at the top level, so the repository's file list is the catalogue. Categories are `basics`, `web`, `languages`, `frameworks`, `infra`, `workflows`, `showcase`, `remote` and `agents`. Examples share nothing at runtime. Copy from `_template/` instead of importing it, so a reader can copy one folder out of the repository and run it.

## Adding an example

1. Pick the category and a name that says what the example does (`infra-postgres-per-lane`, not `infra-demo`). The `project:` name is the folder name without the category (`postgres-per-lane`), which keeps hostnames short: `postgres-per-lane1.localhost`. It must be unique in this repository, specific enough not to collide with someone's real project (`rust-axum`, not `rust`), and must not end in a digit (lane 1 of `web2` and lane 0 of `web21` share `web21.localhost`).
2. Copy `_template/README.md`, and for any example that renders pages, `_template/devlanes.css` and `_template/logo.svg`.
3. Write `devlanes.yaml`, the app and the README.
4. Verify it (below).
5. Add or update its row in the catalogue in `README.md` and set the status to `ready`. Remove its entry from `IDEAS.md` if it had one.

## Example rules

Config:

- `devlanes.yaml` sits at the example's root and starts with `# yaml-language-server: $schema=https://devlanes.run/v1/schema.json`.
- Every example sets these, so pages and `/lane` can show the branch and domain:

  ```yaml
  global_env:
    LANE_LABEL: ${{ lane.label }}
    LANE_DOMAIN: ${{ lane.domain }}
  ```

- Prefer `run_script` over `run` whenever the command is a script in a project file; presets need it.
- Comment the config where a key is the point of the example. Comments say why the key is there, not what the docs already say.
- `devlanes.local.yaml` is gitignored. An example that demonstrates it ships `devlanes.local.example.yaml` and tells the reader to copy it.

Processes:

- Services listen on `PORT` and `HOST` (`127.0.0.1`), or take `${{ self.port }}` as a flag. No hardcoded ports, no literal `PORT` unless the example is about literal ports.
- Every HTTP service has a `hosts` entry under `${{ lane.domain }}` (or a `domain()` name) and a `ready` check that reaches the app: `http` on `/healthz` for servers, `log` for workers. Never `ready: started` for a watcher.
- Every HTTP server answers `GET /healthz` with `200 ok` and `GET /lane` with JSON: `{ "project", "lane", "lane_name", "branch", "service", "port", "url" }`, from `DEVLANES_LANE_PROJECT`, `DEVLANES_LANE`, `DEVLANES_LANE_NAME`, `LANE_LABEL`, `DEVLANES_SERVICE`, `PORT`, and `https://` plus the `X-Forwarded-Host` request header (which proves the request came through the proxy). APIs answer `/` with the same JSON plus a few mock records relevant to the example (`/api/items` or similar). Services with a UI follow "Pages" below. A dev server that cannot add routes, such as Vite, is exempt; its page shows the values instead.
- Browser-facing URLs use `public_url`; server-to-server calls use `url`. APIs read their CORS and CSRF allow-lists from `DEVLANES_ORIGINS`.
- Never set `NODE_TLS_REJECT_UNAUTHORIZED`, `NODE_EXTRA_CA_CERTS` or `SSL_CERT_FILE` yourself; devlanes sets them.
- Keep dependencies few and pinned. Commit lockfiles and set `packageManager` in `package.json`. Single-package Node examples use npm, so Node is the only requirement; pnpm is for examples where the workspace is the point. A no-dependency server (`node:http`, Python's standard library) is fine when the framework is not the point.

Infra:

- Compose services publish ephemeral loopback ports (`"127.0.0.1::5432"`) and have a `healthcheck`. Pin image tags.
- Every `infra.setup` entry that creates something in a shared container has a matching `infra.teardown` entry.
- Per-lane names come from `lanes.vars` (`db_name: app_${{ lane.name }}`), so `lane clean` and teardown stay in sync.
- Containers reach host services through `host.docker.internal:<port>` over HTTP, never through `*.localhost`.

Portability and content:

- Examples run on macOS, Linux and Windows 11 unless the README says otherwise and why. On Windows a `run` string goes through Git for Windows' `sh`, so keep `run` strings POSIX and simple; prefer `run_script` or the list form.
- Line endings are LF (`.gitattributes`). Shell scripts are executable in Git.
- Neutral names only: `acme`, `example.invalid`, branches like `feat/checkout`. No credentials, tokens, private hosts or paths outside the example. Dev-only passwords such as `postgres:postgres` are fine.
- No build output, `node_modules`, `target`, `.venv`, `.wrangler` or `.env` files in Git.

## Pages

Anything an example renders for a person (a React or Vue app, a Next page, a server-rendered template, a static file) uses the devlanes look, never the framework's starter content. After scaffolding with `create-vite`, `create-next-app`, `cargo generate` or similar, delete the starter logos, counters, welcome text and their CSS. Components, routing, templating and the framework's own styling tools are all fine; only the content and look are ours.

Build pages from `_template/devlanes.css` and `_template/logo.svg`. Copy them into the example, or port the rules into the framework's styling (CSS modules, Tailwind theme). The look: yellow page (`--dl-paint`), dark ink, Overpass for text, JetBrains Mono for code and the `devlanes` wordmark, dark terminal-style cards for data.

Every page has:

- a `.dl-header` with the logo and `devlanes` wordmark, and a link to the example's folder on GitHub (`https://github.com/devlanes-run/examples/tree/main/<folder>`);
- a `.dl-title` naming the lane, such as `This is lane 1 of frontend-api.`, with a `.dl-lede` naming the service and the branch's worktree;
- a `.dl-card` with `.dl-rows`: `lane` (index and lane name), `branch`, `service`, `port` and `url`, with `--dl-lane` set to `var(--dl-lane-<index mod 4>)` so two lanes side by side look different;
- what the example is about, in more cards or plain sections: the API's answer, the database name, WebSocket messages, the replica index. Use `.dl-ok` for healthy values, `.dl-bad` for failures, and links for other services in the lane.

Server-rendered pages read the values from the environment and the request. Client-side apps get them from variables the dev server exposes, set in `devlanes.yaml` (`VITE_LANE: ${{ lane.index }}`, `VITE_API_URL: ${{ services.api.public_url }}`), or by fetching `/lane` from their API, and use `window.location.origin` for `url`.

## README

Follow `_template/README.md`: title, purpose, Requirements, Run it, During a start, Try next, Files, Docs. Keep it short enough to read before the first start finishes. Every command shown must work as written from the example's folder, and any output shown must be real output copied from a run. "Try next" is where the example earns its place: each item is one action and the visible result that shows a feature (a second lane, a stopped service's 503 page, `devlanes reload` after an edit, `devlanes lane clean`).

## Verifying

Before marking an example `ready`, run it from a clean checkout of its folder:

```sh
devlanes config check
devlanes start --no-ui
devlanes status
curl -fsS https://<project>.localhost/healthz        # each hostname; add --ssl-revoke-best-effort on Windows
devlanes stop
```

Then start a second lane of the example and check that both answer with their own lane number. A second worktree is what the README tells readers to do; `devlanes lane new --name <project>-review --start` in the same folder gives a second lane without one, which is handy when several people or agents share a checkout. Lane names are shared by every project in the folder and cannot be reused after `lane clean`, so prefix them with the project name. Run everything listed under "Try next", and finish with `devlanes lane clean <lane> --yes` for every lane you created. Examples with infra must also come back after `devlanes lane clean`. Say in the pull request what you verified and on which OS, and what you could not verify.

## Running services as an agent

Run every dev server through devlanes, never with `&`, `nohup` or a background shell. Use `devlanes start`, `devlanes exec --name NAME -- COMMAND` for one-off processes, `devlanes wait`, `devlanes logs UNIT --tail 100`, `devlanes debug why UNIT`, and clean up with `devlanes stop --mine`. The full guide is the [devlanes agent instructions](https://github.com/devlanes-run/devlanes/blob/main/agent-plugin/codex/AGENTS.md).

The daemon is shared with every other project on the machine. Touch only the project you work on: pass `-p <project>` or run from its folder. Never run `devlanes daemon stop`, `daemon restart`, `lane gc --yes`, `infra down` for another project, `setup`, or `config set`, and never stop or clean lanes you did not create. `devlanes stop --mine` without units acts across every lane, and devlanes may count other sessions of the same agent as yours, so always name the units or lane (`devlanes stop --mine "*"` from the example's folder).

## Writing

READMEs, comments and pull requests follow these rules.

- Lead with the point. No preamble, no restating the task, no closing summary.
- Plain, specific words. Sentence-case headings. No headings starting with What, Why, Where or How.
- Say "worktree" and introduce "lane" once. Lane N's domain is the project name followed by N: `hello-node1.localhost`, never `hello-node-1.localhost`.
- No em dashes, no unicode arrows or smart quotes (type `->` and straight quotes), no bold at the start of every bullet.
- No marketing words: seamless, powerful, effortless, simple, magic, just works, spin up, leverage, robust, streamline, unlock, instantly, zero-config, ecosystem, landscape.
- No "It's not X, it's Y", no rhetorical questions answered in the next sentence, no "Here's the thing", no stacks of three short fragments for emphasis, no invented labels.
- Do not count items before listing them ("three steps", "two reasons").
- One noun per thing. A service stays a service.
- Comments in code explain why, when or where, never what the code already says.

## Commits and pull requests

- Branches are `<type>/<short-kebab-description>` (`feat/infra-multi-database`, `fix/hello-node-ready`).
- Commit messages and PR titles are imperative sentences without a type prefix: `Add infra-multi-database`, not `feat: add multi database`.
- A pull request opened by an AI agent names the agent and model in its description (for example `Claude Code / Claude Opus 4.1`).
- One example per pull request.
