# Working in this repository

Each top-level folder named `<category>-<name>` (`basics-hello-node`, `infra-multi-database`) is one runnable example and one devlanes project. An example shows a devlanes feature working in a small app built the way a real team would build it, and lets maintainers exercise that feature before a release. People clone this repository on their own machine or on a remote box and run examples from it, so every example works from a fresh clone with only the tools its README lists.

The devlanes docs are the authority on config keys and commands: [config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md), [CLI reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/cli.md) and the [guides](https://github.com/devlanes-run/devlanes/tree/main/docs/guides). Never invent a key, flag, variable or output line. If an example needs something devlanes does not do, leave it out and add a line to `IDEAS.md`.

`basics-hello-node` is the reference implementation of everything below. When in doubt, do what it does.

## Repository layout

```text
README.md                 how to run examples; the catalogue table is generated from catalog.json
AGENTS.md                 this file
IDEAS.md                  examples waiting on devlanes features, and repository ideas
catalog.json              every example, for the README and the devlanes docs examples page
format.sh                 Prettier, cargo fmt and ruff over everything
build.sh                  installs and builds every example, checks catalog.json
_internal/
  brand/                  devlanes.css and logo.svg, the only copy; examples link to it
  README.template.md      the README every example starts from
  catalog.schema.json     schema for catalog.json
  scripts/catalog.ts      checks catalog.json and renders the README table
<category>-<name>/        one example
```

Categories are `basics`, `web`, `languages`, `frameworks`, `infra`, `workflows`, `showcase` and `remote`.

## Adding an example

1. Pick the category and a name that says what the example does (`infra-postgres-per-lane`, not `infra-demo`). The devlanes `project:` is `example-` plus the folder name without its category (`example-postgres-per-lane`), so it never collides with a reader's own projects. It must not end in a digit (lane 1 of `example-web2` and lane 0 of `example-web21` share a hostname).
2. Start from `_internal/README.template.md` and the structure of `basics-hello-node`.
3. Add the example to `catalog.json` (see "Catalog").
4. Write `devlanes.yaml`, the code and the README, then run `./format.sh` and `./build.sh <folder>`.
5. Verify it (see "Verifying") and set its status to `ready`. Remove its entry from `IDEAS.md` if it had one.

## Catalog

`catalog.json` lists every example folder, in the order the README shows them, and is checked against the folders by `./build.sh`. The devlanes docs render their examples page from it, so keep each field accurate:

- `slug`: the folder name.
- `title`: the README's heading, sentence case, at most 60 characters.
- `description`: one sentence, at most 200 characters, saying what a reader learns ("Give each lane its own Postgres container next to a shared Redis..."), not what files exist.
- `category`: one of the categories above.
- `languages`: what a reader sees in the code, most important first (`typescript`, `python`, `rust`, `shell`).
- `frameworks`: frameworks and notable tools, lowercase (`hono`, `react`, `vite`, `next`, `fastapi`, `axum`, `wrangler`, `docker-compose`, `postgres`).
- `features`: the devlanes config keys and commands the example teaches, written as in `devlanes.yaml` or on the command line (`infra.per_lane`, `ready.log`, `devlanes with`).
- `requires`: tools besides devlanes and Git (`node`, `docker`, `uv`, `rust`).
- `status`: `ready` once the example runs as its README describes, `planned` before.

`_internal/catalog.schema.json` is the full schema. After editing `catalog.json`, `./format.sh` regenerates the README table.

## Example structure

A single-service example keeps its code at the example root:

```text
basics-hello-node/
  README.md
  devlanes.yaml
  package.json  package-lock.json  tsconfig.json
  brand -> ../_internal/brand
  src/
    index.ts        starts the server, nothing else
    env.ts          every variable the service reads, parsed once
    app.tsx         creates the app and registers routes
    lane.ts         the lane values for pages and /lane
    views/          page components
```

An example with several services is an npm workspace with one package per service:

```text
web-frontend-api/
  README.md
  devlanes.yaml
  package.json            "workspaces": ["apps/*", "packages/*"]; build and typecheck run every workspace
  package-lock.json
  tsconfig.base.json      compiler options the apps extend
  docker-compose.yml      when the example has Compose infra
  infra/                  files containers mount (init SQL, provider config)
  apps/
    api/      package.json  tsconfig.json  src/
    web/      package.json  tsconfig.json  vite.config.ts  index.html  src/  brand -> ../../../_internal/brand
    worker/   package.json  tsconfig.json  src/
  packages/
    shared/   only when two apps need the same code (lane values, a typed client)
```

`devlanes.yaml` points each service at its package with `run_script: { file: apps/api/package.json, name: dev }`. One `npm install` at the example root installs every app, so the `install` task runs once.

## Code

General rules, every language:

- Code reads like a small production codebase. Each file has one job; split a file before it reaches about 150 lines and a function before about 40.
- No HTML, CSS or client JavaScript inside string literals. Markup lives in components or template files, styles in CSS files, browser code in its own modules.
- All environment reads happen in one module (`env.ts`, `settings.py`, `config.rs`) that fails at startup with a clear message when a variable is missing. Nothing else reads `process.env` or its equivalents.
- Network calls have timeouts. Errors are handled where something useful can be done and shown on the page when the example is about them; otherwise they propagate.
- Exported functions, components and types get a one-line doc comment. Other comments say why, when or where, never what.
- Typed everywhere: TypeScript `strict`, Python type hints, Rust as usual.
- Every manifest has the scripts `./build.sh` runs (below), and the example passes `./format.sh --check`.

### TypeScript and Node

- TypeScript only, ESM, strict, Node 22 or later. No `.js` or `.mjs` source files except generated output and config files that cannot be TypeScript.
- Use these versions unless the example needs others, so updates happen in one sweep: `hono` 4.13.16, `@hono/node-server` 2.1.6, `tsx` 4.23.15, `typescript` 7.0.2, `@types/node` 26.6.6, `vite` 8.3.6, `@vitejs/plugin-react` 6.2.1, `react` and `react-dom` 19.3.1, `@types/react` and `@types/react-dom` 19.3.0, `wrangler` 4.158.0. Pin exact versions and commit the lockfile.
- Package scripts: `dev` (`tsx watch src/index.ts` for servers, `vite` for frontends), `build` (`tsc`, or `tsc --noEmit && vite build`), `start` for servers (`node dist/index.js`), `typecheck` (`tsc --noEmit`). A workspace root has `build` and `typecheck` that run `--workspaces --if-present`.
- Server `tsconfig.json`: `module` and `moduleResolution` `NodeNext` (imports end in `.js`), `jsx: react-jsx` with `jsxImportSource: hono/jsx`, `rootDir: src`, `outDir: dist`. Copy it from `basics-hello-node`.
- Servers use Hono on `@hono/node-server`. APIs answer with `c.json`. Pages are `hono/jsx` components rendered with `jsxRenderer({ docType: true })` and `c.render`. More than a handful of routes go in `src/routes/<area>.ts(x)`, each exporting a `Hono` instance that `app.tsx` mounts with `app.route`.
- Port-less workers live in `src/index.ts` with the loop, the connection and the shutdown handler as separate functions.
- One-off jobs devlanes runs as tasks (migrations, seeds, cleanup) are files under `src/scripts/` run by package scripts (`"db:migrate": "tsx src/scripts/migrate.ts"`), and the task uses `run_script`.
- Frontends are Vite + React + TypeScript: `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/components/`, `src/api.ts` for calls to the backend, `src/env.ts` for `import.meta.env`. Next.js uses the App Router with `app/`, `components/` and `lib/`.
- Cloudflare Workers use Hono on Workers in `src/index.ts`, typed bindings from `wrangler types`, and `build` runs `wrangler deploy --dry-run --outdir dist`.

### Python

- uv project with `pyproject.toml`, `uv.lock` and `.python-version`, `src/<package>/` layout.
- Modules: `main.py` (creates the app), `settings.py` (environment), `routes/` (one router per area), `templates/` (Jinja, with a `base.html` layout), plus domain modules. Static files are served from the `brand` link.
- Ruff settings live in `pyproject.toml` (`line-length = 100`). `./format.sh` runs `ruff format` and `ruff check --fix`.

### Rust

- A Cargo workspace when the example has several binaries (`crates/<service>/` plus `crates/shared/` for common code), otherwise one crate. `main.rs` only starts the server; `config.rs`, `routes.rs` and `views.rs` (or modules per area) hold the rest.
- HTML comes from templates (askama) in `templates/`. The CSS and logo are served from `include_str!` / `include_bytes!` of the `brand` link.
- Clean under `cargo fmt` and `cargo clippy -- -D warnings`. Commit `Cargo.lock`.

### Shell

- Bash with `set -euo pipefail`, a header comment with the usage line, one function per step, and `main "$@"` as the last line. Each function does one thing in under about 25 lines.
- Validate arguments in a `parse_args` function and print usage on bad input. Use `log` and `die` helpers instead of scattered `echo ... >&2; exit 1`.
- Avoid features missing from bash 3.2 (`mapfile`, associative arrays) when the script may run on macOS. Formatted by Prettier's shell plugin; clean under shellcheck.

### Infra files

- `docker-compose.yml` at the example root. Compose services publish ephemeral loopback ports (`"127.0.0.1::5432"`), have a `healthcheck` and pin image tags.
- Files containers mount go under `infra/`.
- Every `infra.setup` entry that creates something in a shared container has a matching `infra.teardown` entry. Per-lane names come from `lanes.vars` (`db_name: app_${{ lane.name }}`).
- Containers reach host services through `host.docker.internal:<port>` over HTTP, never through `*.localhost`.

## devlanes config

- `devlanes.yaml` sits at the example root, starts with `# yaml-language-server: $schema=https://devlanes.run/v1/schema.json` and names the project `example-<name>`.
- Every example sets these, so pages and `/lane` can show the branch and domain:

  ```yaml
  global_env:
    LANE_LABEL: ${{ lane.label }}
    LANE_DOMAIN: ${{ lane.domain }}
  ```

- Node examples have an `install` task (`run: [npm, install]`, `when: lane.create`), since a new worktree has no `node_modules`. It uses `npm install`, not `npm ci`, because `npm ci` deletes `node_modules` under any lane already running from the same folder.
- Prefer `run_script` over `run` whenever the command is a script in a project file; presets need it.
- Comment the config where a key is the point of the example. Comments say why the key is there, not what the docs say.
- `devlanes.local.yaml` is gitignored. An example that demonstrates it ships `devlanes.local.example.yaml` and tells the reader to copy it.

Processes:

- Services listen on `PORT` and `HOST` (`127.0.0.1`), or take `${{ self.port }}` as a flag. No hardcoded ports, and no literal `PORT` unless the example is about literal ports.
- Every HTTP service has a `hosts` entry under `${{ lane.domain }}` (or a `domain()` name) and a `ready` check that reaches the app: `http` on `/healthz` for servers, an unanchored `log` pattern for workers. Never `ready: started` for a watcher.
- Every HTTP server answers `GET /healthz` with `200 ok` and `GET /lane` with JSON `{ "project", "lane", "lane_name", "branch", "service", "port", "url" }`, where `url` is `https://` plus the `X-Forwarded-Host` request header (proof that the request came through the proxy). APIs answer `/` with the same JSON plus a few mock records relevant to the example. A dev server that cannot add routes, such as Vite, is exempt; its page shows the values instead.
- Browser-facing URLs use `public_url`; server-to-server calls use `url`. APIs read their CORS and CSRF allow-lists from `DEVLANES_ORIGINS`.
- Never set `NODE_TLS_REJECT_UNAUTHORIZED`, `NODE_EXTRA_CA_CERTS` or `SSL_CERT_FILE` yourself; devlanes sets them.

## Pages

Anything an example renders for a person uses the devlanes look, never the framework's starter content. After scaffolding with `create-vite`, `create-next-app` or similar, delete the starter logos, counters, welcome text and their CSS.

The look lives in one place: `_internal/brand/devlanes.css` and `_internal/brand/logo.svg`. Never copy them. Each package that renders pages has a `brand` symbolic link to `_internal/brand` (`ln -s ../_internal/brand brand` at the example root, more `../` in nested apps), so a change to the brand reaches every example. On Windows, create links from Git Bash with `MSYS=winsymlinks:nativestrict ln -s ...` (Developer Mode on), and check that `git status` shows the link, not a copy.

- Hono servers serve the link with `serveStatic({ root: "./" })` under `/brand/*`, as in `basics-hello-node`.
- Vite apps import `../brand/devlanes.css` from `src/main.tsx` and set `resolve.preserveSymlinks: true` so the file stays inside the app's root; check that the dev server and `vite build` both load it.
- Python serves the link as a static folder; Rust embeds it with `include_str!`.
- Example-specific styles go in one small stylesheet next to the components (`src/styles.css`), using the brand's variables and classes. No inline styles except the lane colour variable.

Every page has:

- a `.dl-header` with the logo and `devlanes` wordmark, and a link to the example's folder on GitHub (`https://github.com/devlanes-run/examples/tree/main/<folder>`);
- a `.dl-title` naming the lane, such as `This is lane 1 of example-frontend-api.`, with a `.dl-lede` naming the service and the branch's worktree;
- a `.dl-card` with `.dl-rows`: `lane` (index and lane name), `branch`, `service`, `port` and `url`, with `--dl-lane` set to `var(--dl-lane-<index mod 4>)` on `body`, so two lanes side by side look different;
- what the example is about, in more cards: the API's answer, the database name, WebSocket messages, the replica index. Use `.dl-ok` for healthy values, `.dl-bad` for failures, and links for other services in the lane.

Copy `Layout`, `LaneCard` and `lane.ts` from `basics-hello-node`; React apps use the same markup with `className`. Client-side apps get lane values from variables set in `devlanes.yaml` (`VITE_LANE: ${{ lane.index }}`, `VITE_API_URL: ${{ services.api.public_url }}`) or from their API's `/lane`, and use `window.location.origin` for `url`.

## README

Follow `_internal/README.template.md`: title, purpose, Requirements, Run it, During a start, Try next, Files, Docs. Keep it short enough to read before the first start finishes. Every command shown must work as written from the example's folder, and any output shown must be real output copied from a run, with user names and private paths replaced by `acme`. "Try next" is where the example earns its place: each item is one action and the visible result that shows a feature (a second lane, a stopped service's 503 page, `devlanes reload` after an edit, `devlanes lane clean`). "Files" names folders and the files a reader would open first, not every file.

## Formatting and building

```sh
npm install                  # once, in the repository root
./format.sh                  # or ./format.sh --check
./build.sh basics-hello-node # one example; no arguments builds all
```

`./build.sh` runs, per example: `npm ci && npm run build` (or `pnpm install --frozen-lockfile && pnpm run build` when there is a `pnpm-lock.yaml`), `cargo build --locked`, and `uv sync --frozen && uv run python -m compileall -q src`. An example builds when those pass. Stop an example's lanes before building it, since `npm ci` replaces `node_modules`.

## Verifying

Before marking an example `ready`, run it from a clean checkout of its folder:

```sh
devlanes config check
devlanes start --no-ui
devlanes status
curl -fsS https://example-hello-node.localhost/healthz # each hostname; add --ssl-revoke-best-effort on Windows
devlanes stop
```

Then start a second lane of the example and check that both answer with their own lane number. A second worktree is what the README tells readers to do; `devlanes lane new --name <project>-review --start` in the same folder gives a second lane without one, which helps when several people or agents share a checkout. Lane names are shared by every project in the folder and cannot be reused after `lane clean`, so prefix them with the project name. Run everything listed under "Try next", and finish with `devlanes lane clean <lane> --yes` for every lane you created. Examples with infra must also come back after `devlanes lane clean`. Say in the pull request what you verified and on which OS, and what you could not verify.

## Running services as an agent

Run every dev server through devlanes, never with `&`, `nohup` or a background shell. Use `devlanes start`, `devlanes exec --name NAME -- COMMAND` for one-off processes, `devlanes wait`, `devlanes logs UNIT --tail 100` and `devlanes debug why UNIT`. The full guide is the [devlanes agent instructions](https://github.com/devlanes-run/devlanes/blob/main/agent-plugin/codex/AGENTS.md).

The daemon is shared with every other project on the machine. Touch only the project you work on: pass `-p <project>` or run from its folder. Never run `devlanes daemon stop`, `daemon restart`, `lane gc --yes`, `infra down` for another project, `setup` or `config set`, and never stop or clean lanes you did not create. `devlanes stop --mine` without units acts on every lane of every project, and devlanes may count other sessions of the same agent as yours, so always name the units or lane (`devlanes stop --mine "*"` from the example's folder).

## Writing

READMEs, comments and pull requests follow these rules.

- Lead with the point. No preamble, no restating the task, no closing summary.
- Plain, specific words. Sentence-case headings. No headings starting with What, Why, Where or How.
- Say "worktree" and introduce "lane" once. Lane N's domain is the project name followed by N: `example-hello-node1.localhost`, never `example-hello-node-1.localhost`.
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
