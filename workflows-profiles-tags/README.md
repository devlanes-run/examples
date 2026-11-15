# Profiles and tags

A small shop as an npm workspace: three Hono APIs, two server-rendered web apps, a mailer worker and an on-demand docs site. Tags and templates group the services, and each profile starts a different set of them.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later

## Run it

```sh
cd workflows-profiles-tags
devlanes start
```

`devlanes start --no-ui` prints the start as text:

```text
example-profiles-tags@0 · main
✓ services  4 of 4 ready
  ✓  accounts-api  https://accounts.example-profiles-tags.localhost
  ✓  catalog-api   https://catalog.example-profiles-tags.localhost
  ✓  shop-web      https://example-profiles-tags.localhost
  ✓  mailer        http://127.0.0.1:20565
```

Open https://example-profiles-tags.localhost. The shop page shows lane 0 of `example-profiles-tags` and, for each API it calls, the URL it uses, the lane that answered and the data file that API reads.

## During a start

1. The first start of a lane runs the `install` task. One `npm install` at the root installs every workspace.
2. With nothing to bring back, the start runs the `default` profile, `[+essential]`: accounts-api, catalog-api, shop-web and mailer. billing-api, admin-web and docs stay stopped.
3. Each service runs the `dev` script of its own package. The script is `tsx watch --tsconfig ../../tsconfig.base.json --conditions=development`, which loads `packages/shared` from its source, so an edit there restarts every app that uses it.
4. The APIs answer on `accounts.`, `catalog.` and `billing.example-profiles-tags.localhost`. The `api` template sets `DATA_FILE` to `<lane data folder>/<service>.json`, and each API seeds that file on first read.
5. shop-web (`example-profiles-tags.localhost`) and admin-web (`admin.example-profiles-tags.localhost`) fetch the APIs server-side from `services.<api>.url`. An API that is not running shows `ECONNREFUSED` on the page.
6. mailer has no port. The start waits for its `worker ready:` line (`ready.log`), then mailer polls accounts-api every 3 seconds and logs a welcome mail for each new user. `keep_awake: true` keeps the lane from being throttled or frozen while the mailer runs.

docs has `autostart: false` and `name: Component docs`, which the TUI and `devlanes status` show instead of the key. A service takes the colour of its first tag that has one, so each service lists its category tag first. In the TUI the APIs are cyan, the web apps green, the mailer magenta and docs yellow.

## Try next

- `devlanes stop`, then `devlanes start --profile backend --no-ui`. Only `+api` and `+worker` start, and https://example-profiles-tags.localhost answers 503 because shop-web is stopped:

  ```text
  example-profiles-tags@0 · main
  ✓ services  4 of 4 ready
    ✓  accounts-api  https://accounts.example-profiles-tags.localhost
    ✓  billing-api   https://billing.example-profiles-tags.localhost
    ✓  catalog-api   https://catalog.example-profiles-tags.localhost
    ✓  mailer        http://127.0.0.1:20565
  ```

- `devlanes restart` starts `backend` again. `devlanes stop` forgets it, so the next plain `devlanes start` runs `default`.
- In the TUI that `devlanes start` opens, press `p` on the lane. The picker lists every profile with what it selects (`attach` is marked `no infra`) and checks the one the lane runs. Move to `backend`, press space, then Enter. billing-api starts next to the default profile and the lane's details show `profile   default, backend`.
- `devlanes start docs` starts the on-demand service on https://docs.example-profiles-tags.localhost. While it is stopped, the proxy's 503 page for that hostname names `devlanes start example-profiles-tags@0:docs`.
- `devlanes start --profile all` starts every other service except the mailer (`exclude: [+worker]`) and leaves docs out, since `*` skips `autostart: false`.
- `devlanes debug freeze` on the default profile refuses with `error: lane example-profiles-tags@0 runs keep_awake services (mailer), so it stays awake`.
- Press "Add a user" on the shop page, then `devlanes stop` and `devlanes start --profile test`. The profile sets `DATA_FILE` to `<lane data folder>/test/<service>.json`, so the page shows paths under `test/` and only the two seed users, and the mailer sends their welcome mails again from its own log. `devlanes stop` and `devlanes start` bring back the dev files with the user you added.
- Start a second lane whose web apps use lane 0's APIs: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/workflows-profiles-tags && devlanes start --profile attach`. The new worktree is lane 1 and runs only shop-web and admin-web. The page at https://example-profiles-tags1.localhost says `This is lane 1 of example-profiles-tags.`, links to `https://catalog.example-profiles-tags.localhost`, says `answered by lane 0 main` and lists lane 0's data files. A user added there shows up on lane 0's page and lane 0's mailer sends the mail. admin-web's billing card shows `ECONNREFUSED` while lane 0 does not run billing-api.
- Without a second worktree, `devlanes lane new --name example-profiles-tags-review --start` adds lane 1 in this folder with its own data. `devlanes stop --lane example-profiles-tags-review` and `devlanes start --lane example-profiles-tags-review --profile attach` then give the same result.
- `devlanes lane clean example-profiles-tags-review --yes` and `devlanes lane clean 0 --yes` stop both lanes and delete their data folders. In the second worktree, `devlanes lane clean 1 --yes` does the same for its lane.

## Files

- [`devlanes.yaml`](devlanes.yaml): the tags, the `node`, `server`, `api`, `web` and `worker` templates, the services and the profiles.
- [`apps/accounts-api`](apps/accounts-api), [`apps/billing-api`](apps/billing-api), [`apps/catalog-api`](apps/catalog-api): the APIs, each with a module that keeps its records in `DATA_FILE`.
- [`apps/shop-web`](apps/shop-web), [`apps/admin-web`](apps/admin-web): the web apps.
- [`apps/mailer/src/index.ts`](apps/mailer/src/index.ts): the worker loop and its shutdown handler.
- [`apps/docs`](apps/docs): the on-demand docs page.
- [`packages/shared/src`](packages/shared/src): the code every app uses: `env.ts`, `lane.ts`, the JSON file store and the API client.

## Docs

- [Tags, profiles and templates](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#tags-profiles-and-templates)
- [One lane's frontend against another lane's backend](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#one-lanes-frontend-against-another-lanes-backend)
- [Services that start on demand](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#services-that-start-on-demand)
- [Bringing a lane back](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#bringing-a-lane-back)
- [Lane data folder](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#lane-data-folder)
- [Config reference: profiles](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#profiles)
