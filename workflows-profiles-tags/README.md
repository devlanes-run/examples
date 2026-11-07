# Profiles and tags

A scaled-down SaaS monorepo: one Node server file runs as seven services (three APIs, two web apps, a mailer and a docs site), each in a different role. It shows `tags` with `color` and `description`, `templates` with `extends`, a display `name`, `autostart: false`, a port-less worker with `ready.log` and `keep_awake`, and `profiles` that select services by `+tag`, move the data files within the same lane (`test`) and point one lane's web apps at lane 0's APIs through `lanes.main.services` (`attach`).

## Requirements

- devlanes, with `devlanes setup` run once
- Node 24 (the server has no dependencies)

## Run it

```sh
cd workflows-profiles-tags
devlanes start
```

Open https://profiles-tags.localhost. The shop page shows lane 0 of `profiles-tags` and, for each API it calls, the URL it uses, the lane that answered and the data file that API reads.

## During a start

There is no infra and there are no tasks. The first start of a lane (one worktree's ports, hostnames and data folder) runs the `default` profile, `[+essential]`: accounts-api, catalog-api, shop-web and mailer. billing-api, admin-web and docs stay stopped.

- The APIs answer on `accounts.`, `catalog.` and `billing.profiles-tags.localhost`. Each keeps its records in `<lane data folder>/<service>.json`, set as `DATA_FILE` by the `api` template and seeded on first read. `/` answers with the lane JSON plus `data_file` and the records.
- shop-web (`profiles-tags.localhost`) and admin-web (`admin.profiles-tags.localhost`) fetch the APIs server-side from `services.<api>.url` and link to their `public_url`. An API that is not running shows `ECONNREFUSED` on the page.
- mailer has no port. The start waits for its `worker ready:` line (`ready.log`); after that it polls accounts-api every 3 seconds and logs a welcome mail for each new user. `keep_awake: true` keeps the lane from being throttled or frozen while the mailer runs.
- docs has `autostart: false` and `name: Component docs`, which the TUI and `devlanes status` show instead of the key.

A service takes the colour of its first tag that has one, so each service lists its category tag first: in the TUI the APIs are cyan, the web apps green, the mailer magenta and docs yellow.

## Try next

- `devlanes stop`, then `devlanes start --profile backend --no-ui`. Only `+api` and `+worker` start, and https://profiles-tags.localhost answers 503 because shop-web is stopped:

  ```text
  profiles-tags@0 · main
  ✓ services  4 of 4 ready
    ✓  accounts-api  https://accounts.profiles-tags.localhost
    ✓  billing-api   https://billing.profiles-tags.localhost
    ✓  catalog-api   https://catalog.profiles-tags.localhost
    ✓  mailer        http://127.0.0.1:20495
  ```

- `devlanes restart` starts `backend` again. `devlanes stop` forgets it, so the next plain `devlanes start` runs `default`.
- In the TUI that `devlanes start` opens, press `p` on the lane. The picker lists every profile with what it selects (`attach` is marked `no infra`) and checks the one the lane runs. Move to `backend`, press space, then Enter: billing-api starts next to the default profile and the lane's details show `profile   default, backend`.
- `devlanes start docs` starts the on-demand service on https://docs.profiles-tags.localhost. While it is stopped, the proxy's 503 page for that hostname names `devlanes start profiles-tags@0:docs`. `devlanes start --profile all` starts every other service except the mailer (`exclude: [+worker]`) and leaves docs out, since `*` skips `autostart: false`.
- `devlanes debug freeze` on the default profile refuses with `error: lane profiles-tags@0 runs keep_awake services (mailer), so it stays awake`.
- Press "Add a user" on the shop page, then `devlanes stop` and `devlanes start --profile test`. The profile sets `DATA_FILE` to `<lane data folder>/test/<service>.json`, so the page shows paths under `test/` and only the two seed users, and the mailer sends their welcome mails again from its own log. `devlanes stop` and `devlanes start` bring back the dev files with the user you added.
- `devlanes lane new --name review --start` adds lane 1 in the same folder, on https://profiles-tags1.localhost with its own data. Then `devlanes stop --lane review` and `devlanes start --lane review --profile attach` run only shop-web and admin-web there. The lane 1 shop page now links to `https://catalog.profiles-tags.localhost`, says `answered by lane 0 main` and lists lane 0's data files. A user added there shows up on lane 0's page and lane 0's mailer sends the mail. admin-web's billing card shows `ECONNREFUSED` while lane 0 does not run billing-api.
- `devlanes lane clean review --yes` and `devlanes lane clean 0 --yes` stop both lanes and delete their data folders.

## Files

- `devlanes.yaml`: the tags, the `node`, `api`, `web` and `worker` templates, seven services and six profiles.
- `server.mjs`: the one server; `ROLE` makes it an API, a web app, the mailer or the docs site.
- `package.json`, `package-lock.json`: the `start` script every service runs through `run_script`.
- `devlanes.css`, `logo.svg`: the page look.

## Docs

- [Tags, profiles and templates](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#tags-profiles-and-templates)
- [One lane's frontend against another lane's backend](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#one-lanes-frontend-against-another-lanes-backend)
- [Services that start on demand](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#services-that-start-on-demand)
- [Bringing a lane back](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#bringing-a-lane-back)
- [Lane data folder](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#lane-data-folder)
- [Config reference: profiles](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#profiles)
