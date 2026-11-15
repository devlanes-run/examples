# From mprocs to devlanes

A small stack migrated from mprocs to devlanes, with the mprocs setup in `before/` and the devlanes one in `devlanes.yaml`. The stack is an npm workspace of TypeScript apps on [Hono](https://hono.dev): an `api` that keeps text messages in a JSON file, a `web` page that lists them, a `worker` without a port that sends queued messages through an `sms-stub`, and `db:migrate` and `db:seed` scripts in the api.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later
- No mprocs or Caddy: the files in `before/` are for reading, and this example never runs them

## Run it

```sh
cd workflows-mprocs-migration
devlanes start
```

`devlanes start --no-ui` prints the start as text:

```text
example-mprocs-migration@0 (main): 3/3 ready
ready api http://127.0.0.1:20410 https://api.example-mprocs-migration.localhost
ready web http://127.0.0.1:20411 https://example-mprocs-migration.localhost
ready worker http://127.0.0.1:20412
```

Open https://example-mprocs-migration.localhost. The page lists three messages marked `queued` and shows the hostnames that replaced the Caddy ones.

## During a start

1. The first start of a lane runs the `install` task (`npm install` at the example root, `when: lane.create`).
2. `migrate` runs on every start (`when: lane.start`) and creates the data file in the lane's data folder, `DATA_FILE: ${{ lane.data_path }}/acme.json`.
3. The `default` profile starts the services tagged `essential`: `api` on https://api.example-mprocs-migration.localhost, ready once `/healthz` answers (it answers 503 until the data file exists), `web` on https://example-mprocs-migration.localhost, and `worker`, ready once it prints `worker ready` after its first answer from the api.
4. `seed` runs once per lane after the services are ready (`when: lane.create`, `after: services`) and queues three messages through the api.
5. The worker tries to send them to the stub on `127.0.0.1:4010`. The stub is not in the default profile, so they stay queued, and `devlanes logs worker` says so:

   ```text
   worker#7 sms-stub not reachable at http://127.0.0.1:4010: ECONNREFUSED; 3 queued
   ```

## Before and after

The apps read the same variables in both setups, with the old fixed ports as their defaults.

| mprocs setup (`before/`)                                                              | `devlanes.yaml`                                                                                                                            |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `procs.api`, `web`, `worker`, `sms-stub` running `npm run dev --workspace apps/<app>` | `services` with `run_script: { file: apps/<app>/package.json, name: dev }`                                                                 |
| `npm install` by hand after every checkout                                            | `install` task with `when: lane.create`                                                                                                    |
| `API_PORT` exported by `slot.sh` as `4000 + 100 * slot`                               | `API_PORT: ${{ self.port }}`, for an app that reads its own variable instead of `PORT`                                                     |
| `PORT=${WEB_PORT:-3000}` in web's `shell`                                             | nothing: devlanes sets `PORT` on every service                                                                                             |
| `PORT=4010` in the stub's `shell`                                                     | `env: { PORT: 4010 }`, which only one lane at a time can run                                                                               |
| `API_URL`, `API_PUBLIC_URL`, `SMS_PUBLIC_URL` exported by `slot.sh`                   | `${{ services.api.url }}`, `${{ services.api.public_url }}`, `${{ services.sms_stub.public_url }}`                                         |
| `Caddyfile` blocks, one set per slot, and Caddy in `docker-compose.yml`               | `hosts` on each service, served over HTTPS by the devlanes proxy                                                                           |
| `docker-up` and `docker-down` panes                                                   | dropped, since they only ran Caddy. A stack with a database moves its Compose file to `infra.compose` and lists `caddy` in `infra.exclude` |
| `scripts/slot.sh` and its list of worktrees                                           | lanes: every worktree gets its own port block and `example-mprocs-migration<N>.localhost`                                                  |
| `NODE_OPTIONS: --use-system-ca` for Caddy's local CA                                  | deleted: devlanes sets `NODE_EXTRA_CA_CERTS` on Node services, and `web` calls the api over `http://127.0.0.1`                             |
| `.data/acme.json` in the worktree                                                     | `DATA_FILE: ${{ lane.data_path }}/acme.json`                                                                                               |
| `mprocs.essentials.yaml`, a copy with `autostart: false`                              | `profiles.default: [+essential]`                                                                                                           |
| a third copy for backend work, never written                                          | `profiles.backend: [+api, +worker, +stub]`                                                                                                 |
| `migrate` pane, `autostart: false`                                                    | task with `when: lane.start`                                                                                                               |
| `seed` pane, `autostart: false`                                                       | task with `when: lane.create` and `after: services`; `devlanes run seed` for more                                                          |
| `btop` pane                                                                           | `devlanes debug top`                                                                                                                       |

### Not carried over

- `autorestart: true` on `api` and `worker`. devlanes never restarts a process: a service that exits shows as failed with its log. Every app runs under `tsx watch`, which restarts it when its code changes.
- `deps: [api]` on `worker`. devlanes starts services together and has no dependencies between them. The worker retries until the api answers and prints `worker ready` only then, so its `ready.log` check covers the order. Containers and tasks do run first (`infra`, then `lane.create` and `lane.start` tasks, then services, then `after: services` tasks).

## Try next

On Windows, add `--ssl-revoke-best-effort` to the `curl` commands.

- Start the stub with `devlanes start sms-stub`. The worker sends the queued messages, and the page shows them as `sent`. With `--no-ui`:

  ```text
  example-mprocs-migration@0 (main): 1/1 ready
  ready sms-stub http://127.0.0.1:4010 https://sms.example-mprocs-migration.localhost
  ```

- `devlanes run seed` queues three more messages, and they go out within two seconds.
- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/workflows-mprocs-migration && devlanes start`.
- Without a worktree, `devlanes lane new --name example-mprocs-migration-review --start` gives a second lane in the same folder. https://example-mprocs-migration1.localhost shows `This is lane 1 of example-mprocs-migration.` with its own api, data file and messages, and there is no slot list or Caddy block to edit.
- Lane 1's `SMS_URL` is `http://127.0.0.1:4010` too, so with lane 0's stub running, lane 1's worker sends its seeded messages there. `curl -fsS https://sms.example-mprocs-migration.localhost/messages` lists them with `"from_lane":1`.
- Start the stub in lane 1 with `devlanes start sms-stub` in the worktree, or `devlanes start example-mprocs-migration-review:sms-stub --no-ui` for the `lane new` lane. It fails while lane 0 holds the port:

  ```text
  example-mprocs-migration@1 (main): not ready, 1 failed
  failed sms-stub
    port 4010 is taken by example-mprocs-migration@0:sms-stub
    more: devlanes logs example-mprocs-migration@1:sms-stub --tail 200
  ```

- Switch profiles: `devlanes stop`, then `devlanes start --profile backend` starts `api`, `worker` and `sms-stub` without `web`, and the page answers with the proxy's `Service not running` page (503). `devlanes start --profile default --profile backend` starts all four, which is what `mprocs.yaml` started.
- Run `devlanes debug top` for CPU and memory per lane and service, the job the `btop` pane did.
- Remove the lanes with `devlanes lane clean example-mprocs-migration-review --yes` and `devlanes lane clean 0 --yes`. Each lane's data file goes with its data folder.

## Files

- [`devlanes.yaml`](devlanes.yaml): the services, tasks and profiles, with a comment naming the mprocs, Caddy or `slot.sh` piece each key replaces.
- [`before/`](before): `mprocs.yaml`, `mprocs.essentials.yaml`, `Caddyfile`, `docker-compose.yml` and `scripts/slot.sh`, for reference only.
- [`apps/api/`](apps/api): messages in `DATA_FILE`, listening on `API_PORT` (default 4000), with `src/scripts/migrate.ts` and `src/scripts/seed.ts`.
- [`apps/web/`](apps/web): the page, on `PORT` (default 3000).
- [`apps/worker/`](apps/worker): sends queued messages to `SMS_URL` (default `http://127.0.0.1:4010`).
- [`apps/sms-stub/`](apps/sms-stub): the fake SMS provider on `PORT` (default 4010), with its inbox at `/messages`.

## Docs

- [Ports and environment: the service's port](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#the-services-port)
- [Ports and environment: lane data folder](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#lane-data-folder)
- [Service patterns: tags, profiles and templates](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#tags-profiles-and-templates)
- [Lifecycle](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md)
