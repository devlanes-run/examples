# Many datastores with a namespace per lane

A TypeScript server over Postgres, Redis, ClickHouse, RabbitMQ and an S3 store, all shared by every lane, where each lane gets its own database, Redis index, ClickHouse database, vhost and bucket. The names come from `lanes.vars`, `infra.setup` creates them, `infra.teardown` removes them, `infra.per_lane` gives each lane its own Mailpit, and `infra.hosts` puts the web consoles on HTTPS hostnames.

Every command against a container runs inside it (`docker compose exec -T` or `docker compose run --rm`), so the host needs no `psql`, `redis-cli`, `clickhouse-client` or S3 CLI.

## Requirements

- devlanes, with `devlanes setup` run once
- Docker with Compose 2.24.4 or newer
- Node 22 or later (tested with Node 24 and npm 11)

## Run it

```sh
cd infra-multi-database
devlanes start
```

On a terminal, `devlanes start` opens the TUI and follows the start there. `devlanes start --no-ui` prints it as text instead:

```text
example-multi-database@0 (main): 1/1 ready
ready api http://127.0.0.1:20430 https://example-multi-database.localhost
```

The first start pulls the images, about 2.5 GB in `docker image ls`. Open https://example-multi-database.localhost. The page says `This is lane 0 of example-multi-database.` and shows one card per store with this lane's namespace, a health line and a `Write and read` button. The button inserts a row, runs `INCR`, inserts into a ClickHouse table, publishes and consumes a message, uploads and lists an object, or sends a mail and reads the inbox back, and the card prints what came back:

```text
INSERT INTO notes -> id 1
SELECT count(*) FROM notes -> 1
```

https://example-multi-database.localhost/api/stores returns the namespaces and health lines as JSON, and `/lane` the lane values.

## Shared or per lane

| Store       | Container | Lane 0                                         | Lane 1                         | Reason                                                                                                                                                                                                                                                 |
| ----------- | --------- | ---------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Postgres    | shared    | database `app_main`                            | `app_lane1`                    | A database keeps tables, migrations and connections apart, and one server is enough for every branch. Use a per-lane Postgres when branches need different versions or destructive migrations ([infra-postgres-per-lane](../infra-postgres-per-lane)). |
| Redis       | shared    | index `0`                                      | `1`                            | An index costs nothing and `FLUSHDB` clears one lane. Redis has 16 by default, so lanes 16 and up would need `databases` raised.                                                                                                                       |
| ClickHouse  | shared    | database `app_main`                            | `app_lane1`                    | The server takes a few hundred MB of memory, too much to run once per lane.                                                                                                                                                                            |
| RabbitMQ    | shared    | vhost `app_main`                               | `app_lane1`                    | A vhost has its own queues, exchanges and permissions.                                                                                                                                                                                                 |
| S3 (RustFS) | shared    | bucket `app-main`                              | `app-lane1`                    | One bucket per lane, with a dash because bucket names allow no underscore.                                                                                                                                                                             |
| Mailpit     | per lane  | Compose project `example-multi-database-lane0` | `example-multi-database-lane1` | Mailpit has nothing to namespace: every message lands in one inbox. A container per lane gives each lane its own inbox, and `lane clean` removes it.                                                                                                   |

MinIO no longer publishes images (its Docker Hub repositories were removed in September 2026), so the S3 store is [RustFS](https://github.com/rustfs/rustfs), which speaks the same S3 API and has a web console. The `rc` service in `docker-compose.yml` is its command line, kept out of `docker compose up` by a Compose profile.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0, named `main`.

1. The shared containers start in the Compose project `example-multi-database` (`infra.project_name`), then this lane's Mailpit in `example-multi-database-lane0`. devlanes waits for every healthcheck.
2. The `infra.setup` entries run at the same time, once per lane, and are recorded as done:
   - `postgres` pipes `SELECT 'CREATE DATABASE ...' WHERE NOT EXISTS (...) \gexec` into `psql`;
   - `redis` sets `lane:owner` in the lane's index, which the Redis card shows;
   - `clickhouse` runs `CREATE DATABASE IF NOT EXISTS`;
   - `rabbitmq` waits for the node, adds the vhost and grants the `app` user on it;
   - `s3` runs `rc bucket create --ignore-existing` in a throwaway `rc` container.
3. The `install` task (`when: lane.create`) runs `npm install` on the lane's first start.
4. `api` starts with `npm run dev` (`tsx watch src/index.ts`) and the URLs from `global_env` (`DATABASE_URL`, `REDIS_URL`, `CLICKHOUSE_URL`, `AMQP_URL`, `S3_URL`, `SMTP_URL`), and is ready once `/healthz` answers.

Every entry can run again without harm, as `devlanes run infra.setup.postgres` shows. Each module in `src/stores/` reads its namespace back from the end of its URL, so the store code never builds a lane name itself.

The consoles, all on the lane's domain:

| Hostname                                                        | Container port | Login                         |
| --------------------------------------------------------------- | -------------- | ----------------------------- |
| https://rustfs.example-multi-database.localhost/rustfs/console/ | 9001           | `rustfsadmin` / `rustfsadmin` |
| https://rabbitmq.example-multi-database.localhost               | 15672          | `app` / `app`                 |
| https://clickhouse.example-multi-database.localhost/play        | 8123           | `app` / `app`                 |
| https://mail.example-multi-database.localhost                   | 8025           | none                          |

The shared consoles show every lane's databases, vhosts and buckets; Mailpit shows only the lane's own mail. Postgres and Redis have no console and are in `infra.hidden`, so a machine connected with `devlanes remote connect` does not mirror their raw ports; remove a name there to reach a box's database from your own client. On this machine, open a shell in them with the command on their card, or run a query:

```sh
docker compose -p example-multi-database exec -T postgres psql -U postgres app_main -c 'SELECT count(*) FROM notes'
```

Outside devlanes, always pass `-p example-multi-database`: a plain `docker compose` in this folder uses a project named after the folder.

`devlanes infra status` lists both Compose projects with their health and host ports (excerpt):

```text
infra for example-multi-database@0
  shared:
    project: example-multi-database
    services: clickhouse, postgres, rabbitmq, redis, rustfs
  ...
  lane:
    project: example-multi-database-lane0
    services: mailpit
```

`devlanes infra logs postgres --tail 3` prints a container's Docker logs:

```text
postgres#1 2026-11-07 01:08:59.077 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
postgres#2 2026-11-07 01:08:59.081 UTC [66] LOG:  database system was shut down at 2026-11-07 01:08:58 UTC
postgres#3 2026-11-07 01:08:59.084 UTC [1] LOG:  database system is ready to accept connections
```

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/infra-multi-database && devlanes start`. This step was not run for this README. In this folder, `devlanes lane new --name example-multi-database-review --start` gives lane 1 without a worktree, and is what the output below comes from. https://example-multi-database1.localhost shows `This is lane 1 of example-multi-database.` using the same containers with its own namespaces, and `devlanes env show api --lane example-multi-database-review` lists its URLs (excerpt):

  ```text
  AMQP_URL=amqp://app:app@127.0.0.1:55408/app_lane1
  CLICKHOUSE_URL=http://app:app@127.0.0.1:55410/app_lane1
  DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55404/app_lane1
  REDIS_URL=redis://127.0.0.1:55413/1
  S3_URL=http://rustfsadmin:rustfsadmin@127.0.0.1:55418/app-lane1
  SMTP_URL=smtp://127.0.0.1:20591
  ```

  The ports of the shared stores match lane 0's; only the SMTP port belongs to the lane's own Mailpit. Press `Write and read` on the Mailpit card of lane 1: the mail shows up at https://mail.example-multi-database1.localhost and not at https://mail.example-multi-database.localhost.

- Restart RabbitMQ with `docker compose -p example-multi-database restart rabbitmq`, then run `devlanes restart`. Docker gives the restarted container a new host port, which the lane restart reads back. Because the `rabbitmq` entry sets `container: rabbitmq`, the restart also runs it again, and `devlanes logs setup.rabbitmq` shows another `Adding vhost "app_main" ...` line; the other entries stay done. A plain `devlanes start` runs the entry again too, but in devlanes 0.11.3 it leaves `api` and the console route on the old port, so the RabbitMQ card shows `connect ECONNREFUSED` until the restart.
- Clean the second lane: `devlanes lane clean example-multi-database-review --yes` (`devlanes lane clean 1 --yes` for the worktree's lane) prints `cleaned example-multi-database@1: stopped 1 unit, teardown postgres, redis, clickhouse, rabbitmq, s3`. `app_lane1`, index 1, the vhost and the `app-lane1` bucket with its objects are gone, lane 1's Mailpit container is removed, and lane 0's data is untouched.
- Remove everything this example created: `devlanes lane clean 0 --yes`, then `devlanes infra down` to stop the shared containers, then `docker compose -p example-multi-database down -v` to delete them with their volumes. The next `devlanes start` creates everything again.

## Files

- `devlanes.yaml`: the per-lane names, setup and teardown for each store, console hostnames, the URLs in `global_env`, the `install` task and the `api` service.
- `docker-compose.yml`: the containers with pinned images, loopback ports and healthchecks, plus the `rc` S3 command line under a profile.
- `src/stores/`: one module per store with its namespace, health check and write-then-read; `store.ts` is the shape they share.
- `src/routes/`: the dashboard at `/`, the `POST /stores/<store>/try` action of each card and `GET /api/stores`.
- `src/views/`: the page as JSX components (`Layout`, `LaneCard`, `StoreCard`, `DashboardPage`).
- `src/env.ts`: every variable the service reads, parsed once.
- `brand`: a link to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [Infra guide](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/infra.md)
- [Ports and environment: expressions and `lanes.vars`](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#expressions)
- [Config reference: `infra`](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#infra)
