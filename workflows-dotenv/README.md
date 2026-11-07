# Dotenv and one domain root

A gitignored `.env` holds what a secrets vault would hand you: an API token, feature flags and an optional Sentry DSN. devlanes reads `.env` only for `${{ env.X }}` expressions, so `global_env` names each key a process gets. The apps build every URL and their cookie domain from one variable, `APP_DOMAIN: ${{ lane.domain }}`, so lanes share one `.env` and still get their own URLs. Two [Hono](https://hono.dev) services run it: `web` at `https://example-dotenv.localhost` and `api` at `https://api.example-dotenv.localhost`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (tested with Node 24 and npm 11)

## Run it

```sh
cd workflows-dotenv
cp .env.example .env
devlanes start
```

`.env` is gitignored by the repository's `.gitignore`. Without it both services fail on `ACME_API_TOKEN`, the one key `devlanes.yaml` requires, with `devlanes.yaml in global_env.ACME_API_TOKEN is invalid: expression resolved to an undefined value` and the file and line.

With `.env` in place, `devlanes start --no-ui` prints:

```text
example-dotenv@0 (main): 2/2 ready
ready web http://127.0.0.1:20531 https://example-dotenv.localhost
ready api http://127.0.0.1:20530 https://api.example-dotenv.localhost
```

Open https://example-dotenv.localhost. The page says `This is lane 0 of example-dotenv.` and lists every key in `.env` with what reached the `web` process: `ACME_API_TOKEN` is `set` with its value hidden, `FEATURE_FLAGS` shows `new-checkout,dark-mode`, `SENTRY_DSN` is `empty`, and `ACME_ADMIN_PASSWORD` is `not in this process`.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0.

1. devlanes evaluates `global_env` for the lane. `${{ env.X }}` looks in the shell that ran devlanes first, then in `.env`. `ACME_API_TOKEN` has no default, so the start fails without it; `FEATURE_FLAGS` and `SENTRY_DSN` use `| default('')` and come out empty instead.
2. The first start of a lane runs the `install` task (`npm install` at the example root), which installs both apps and `packages/config`.
3. `web` and `api` start with `PORT`, `HOST` and the same `global_env`. From `.env` they get the three keys `global_env` names and nothing else.
4. The ready checks wait for `/healthz`. The proxy routes `example-dotenv.localhost` and `assets.example-dotenv.localhost` to `web` and `api.example-dotenv.localhost` to `api`.

Each app's `src/env.ts` passes `APP_DOMAIN` to `appUrls` in `packages/config`, which derives the web, api and asset URLs and the cookie domain, and the page puts each one to use. Its CSS and logo load from `https://assets.example-dotenv.localhost`. It sets an `acme_session` cookie with `Domain=example-dotenv.localhost`. On the server, `web` calls `https://api.example-dotenv.localhost/api/orders` with `ACME_API_TOKEN` as a bearer token, and `api` checks it against its own copy from the same `.env` (`200, 3 orders`). In the browser, the page calls `/api/session` on the api with the cookie and shows `api saw acme_session=...`; the api allows the origin because it is in `DEVLANES_ORIGINS`.

To list the keys, `web` reads the same `.env` that devlanes reads, takes only the names, and looks each one up in its own environment; `dotenvSummary` in `packages/config` hides the values of keys named like secrets. In this repository the project file sits in a subfolder: devlanes reads `.env` next to `devlanes.yaml`, while `${{ lane.path }}` and `${{ project.primary_path }}` are the repository root. `web` joins `DOTENV_ROOT` with the example's path inside the worktree to find the primary worktree's copy.

## Try next

- In `.env`, change `FEATURE_FLAGS` to `new-checkout,dark-mode,beta-search` and save. The running services keep the old value, and `devlanes status` names the variable without its value:

  ```text
  example-dotenv
    LANE  BRANCH  STATE    SERVICES  CPU   MEM        URL
    0     main    running  2/2       0.0%  179.3 MiB  https://example-dotenv.localhost  (config changed: 2 changed; devlanes reload --lane example-dotenv@0 applies it)

    UNIT     STATE   PORT   CPU   MEM       URL
    web      ready   20531  0.0%  91.9 MiB  https://example-dotenv.localhost
    api      ready   20530  0.0%  87.5 MiB  https://api.example-dotenv.localhost
    install  exited  –      –     –
    web: env FEATURE_FLAGS changed in the project file
    api: env FEATURE_FLAGS changed in the project file
  ```

  `devlanes reload` restarts both services. The page and https://api.example-dotenv.localhost then list `beta-search`.

- Change `ACME_ADMIN_PASSWORD` in `.env`. `devlanes status` shows no change, since no expression reads that key.
- Set `SENTRY_DSN=https://public@sentry.example.invalid/1` in `.env`. `devlanes status` lists `env SENTRY_DSN` for both services. `devlanes reload web` restarts only `web`, whose page then shows `SENTRY_DSN` as `set` and `Sentry` as `on`, while `api` stays marked until a plain `devlanes reload`.
- The shell comes before `.env`: `FEATURE_FLAGS=from-shell devlanes restart api`, and https://api.example-dotenv.localhost lists only `from-shell`. `devlanes restart api` from a shell without the variable goes back to the value in `.env`.
- Edit `packages/config/src/urls.ts` and save. Both apps load it from source, so `devlanes logs api` shows `[tsx] change in ./..\..\packages\config\src\urls.ts Restarting...` (with `/` on macOS and Linux), and `web` restarts the same way.
- Start a second lane in a new worktree: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/workflows-dotenv && devlanes start`. The new worktree has no `.env`, since Git does not copy ignored files. Per the docs, `${{ env.X }}` then falls back to the primary worktree's `.env`, and the page's `file` row names that file. Lane 1 answers at https://example-dotenv1.localhost with `APP_DOMAIN` set to `example-dotenv1.localhost`. This step was not run for this README.
- For a second lane without a worktree, `devlanes lane new --name example-dotenv-review --start` adds lane 1 in this folder. Its page at https://example-dotenv1.localhost shows `APP_DOMAIN` `example-dotenv1.localhost`, the api at https://api.example-dotenv1.localhost and a cookie with `Domain=example-dotenv1.localhost`. Both lanes read the same `.env`, so an edit marks both:

  ```text
  example-dotenv
    LANE  BRANCH  STATE    SERVICES  CPU   MEM        URL
    0     main    running  2/2       0.0%  136.5 MiB  https://example-dotenv.localhost  (config changed: 2 changed; devlanes reload --lane example-dotenv@0 applies it)
    1     main    running  2/2       0.0%  136.8 MiB  https://example-dotenv1.localhost  (config changed: 2 changed; devlanes reload --lane example-dotenv@1 applies it)
  ```

  `devlanes reload` applies lane 0 and `devlanes reload --lane example-dotenv-review` lane 1.

- When you are done, `devlanes lane clean example-dotenv-review --yes` and `devlanes lane clean 0 --yes` stop the lanes and delete their data.

## Files

- `.env.example`: the fake values to copy to `.env`, including `ACME_ADMIN_PASSWORD`, which no process gets.
- `devlanes.yaml`: `global_env` with `APP_DOMAIN`, `DOTENV_ROOT` and the `${{ env.X }}` keys, the `install` task, and the `web` and `api` services.
- `packages/config/src/`: `urls.ts` builds every URL and the cookie domain from `APP_DOMAIN`, `dotenv.ts` finds `.env` and summarizes its keys with secrets hidden, `lane.ts` holds the values for `/lane`.
- `apps/web/src/`: `env.ts`, `app.tsx` with the routes, `session.ts` for the `acme_session` cookie, `orders.ts` for the server-side call to the api, `views/` for the page and `client/session.ts` for the browser's call.
- `apps/api/src/`: `env.ts`, `app.ts` with `/` and the derived config, `routes/api.ts` with `/api/orders` behind the token and `/api/session` with CORS from `DEVLANES_ORIGINS`.
- `apps/web/brand`: a link to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [.env files](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#env-files)
- [Expressions](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#expressions)
- [Environment layers](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#layers)
- [Editing the project file](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#editing-the-project-file)
- [Config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md)
