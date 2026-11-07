# Many datastores with a namespace per lane

A Node API over Postgres, Redis, ClickHouse, RabbitMQ and an S3 store, all shared by every lane, where each lane gets its own database, Redis index, ClickHouse database, vhost and bucket. The names come from `lanes.vars`, `infra.setup` creates them, `infra.teardown` removes them, `infra.per_lane` gives each lane its own Mailpit, and `infra.hosts` puts the web consoles on HTTPS hostnames.

Every command against a container runs inside it (`docker compose exec -T` or `docker compose run --rm`), so the host needs no `psql`, `redis-cli`, `clickhouse-client` or S3 CLI.

## Requirements

- devlanes, with `devlanes setup` run once
- Docker with Compose 2.24.4 or newer
- Node 22 or newer (tested with Node 24 and npm 11)

## Run it

```sh
cd infra-multi-database
devlanes start --no-ui
```

```text
✓ infra
✓ setup
✓ install
multi-database@0 · main
✓ services  1 of 1 ready
  ✓  api  https://multi-database.localhost
```

The first start pulls the images, about 2.5 GB in `docker image ls`. Open https://multi-database.localhost. The page shows lane 0 of `multi-database` and one card per store with this lane's namespace, a health line and a **Write and read** button that inserts a row, runs `INCR`, inserts into a ClickHouse table, publishes and consumes a message, uploads and lists an object, or sends a mail and reads the inbox back.

## Shared or per lane

| Store | Container | Lane 0 | Lane 1 | Reason |
| --- | --- | --- | --- | --- |
| Postgres | shared | database `app_main` | `app_lane1` | A database keeps tables, migrations and connections apart, and one server is enough for every branch. Use a per-lane Postgres when branches need different versions or destructive migrations ([infra-postgres-per-lane](../infra-postgres-per-lane)). |
| Redis | shared | index `0` | `1` | An index costs nothing and `FLUSHDB` clears one lane. Redis has 16 by default, so lanes 16 and up would need `databases` raised. |
| ClickHouse | shared | database `app_main` | `app_lane1` | The server takes a few hundred MB of memory, too much to run once per lane. |
| RabbitMQ | shared | vhost `app_main` | `app_lane1` | A vhost has its own queues, exchanges and permissions. |
| S3 (RustFS) | shared | bucket `app-main` | `app-lane1` | One bucket per lane, with a dash because bucket names allow no underscore. |
| Mailpit | per lane | Compose project `multi-database-lane0` | `multi-database-lane1` | Mailpit has nothing to namespace: every message lands in one inbox. A container per lane gives each lane its own inbox, and `lane clean` removes it. |

MinIO no longer publishes images (its Docker Hub repositories were removed in September 2026), so the S3 store is [RustFS](https://github.com/rustfs/rustfs), which speaks the same S3 API and has a web console. The `rc` service in `docker-compose.yml` is its command line, kept out of `docker compose up` by a Compose profile.

## During a start

1. The shared containers start in the Compose project `multi-database` (`infra.project_name`), then this lane's Mailpit in `multi-database-lane0`. devlanes waits for every healthcheck.
2. The `infra.setup` entries run at the same time, once per lane, and are recorded as done:
   - `postgres` pipes `SELECT 'CREATE DATABASE ...' WHERE NOT EXISTS (...) \gexec` into `psql`;
   - `redis` sets `lane:owner` in the lane's index, which the Redis card shows;
   - `clickhouse` runs `CREATE DATABASE IF NOT EXISTS`;
   - `rabbitmq` adds the vhost and grants the `app` user on it;
   - `s3` runs `rc bucket create --ignore-existing` in a throwaway `rc` container.
3. The `install` task (`when: lane.create`) runs `npm install` on the lane's first start.
4. `api` starts with the URLs from `global_env` (`DATABASE_URL`, `REDIS_URL`, `CLICKHOUSE_URL`, `AMQP_URL`, `S3_URL`, `SMTP_URL`) and is ready once `/healthz` answers.

Every entry can run again without harm, as `devlanes run infra.setup.postgres` shows. The page reads each namespace back from its URL, so the code never looks at the lane number.

The consoles, all on the lane's domain:

| Hostname | Container port | Login |
| --- | --- | --- |
| https://rustfs.multi-database.localhost/rustfs/console/ | 9001 | `rustfsadmin` / `rustfsadmin` |
| https://rabbitmq.multi-database.localhost | 15672 | `app` / `app` |
| https://clickhouse.multi-database.localhost/play | 8123 | `app` / `app` |
| https://mail.multi-database.localhost | 8025 | none |

The shared consoles show every lane's databases, vhosts and buckets; Mailpit shows only the lane's own mail. Postgres and Redis have no console and are in `infra.hidden`, so a machine connected with `devlanes remote connect` does not mirror their raw ports; remove a name there to reach a box's database from your own client. On this machine, open a shell in them with the command on their card:

```sh
docker compose -p multi-database exec -T postgres psql -U postgres app_main -c 'SELECT count(*) FROM notes'
```

Outside devlanes, always pass `-p multi-database`: a plain `docker compose` in this folder uses a project named after the folder.

`devlanes infra status` lists both Compose projects with their health and host ports (excerpt):

```text
infra for multi-database@0
  shared:
    project: multi-database
    services: clickhouse, postgres, rabbitmq, redis, rustfs
  ...
  lane:
    project: multi-database-lane0
    services: mailpit
```

`devlanes infra logs postgres --tail 3` prints a container's Docker logs:

```text
postgres#1 2026-11-06 20:46:20.651 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
postgres#2 2026-11-06 20:46:20.655 UTC [66] LOG:  database system was shut down at 2026-11-06 20:46:20 UTC
postgres#3 2026-11-06 20:46:20.658 UTC [1] LOG:  database system is ready to accept connections
```

## Try next

- Start a second lane in this folder: `devlanes lane new --name review --start`. https://multi-database1.localhost shows lane 1 using the same containers with its own namespaces, and `devlanes env show api --lane review` lists its URLs (excerpt):

  ```text
  AMQP_URL=amqp://app:app@127.0.0.1:50559/app_lane1
  CLICKHOUSE_URL=http://app:app@127.0.0.1:50558/app_lane1
  DATABASE_URL=postgres://postgres:postgres@127.0.0.1:50561/app_lane1
  REDIS_URL=redis://127.0.0.1:50557/1
  S3_URL=http://rustfsadmin:rustfsadmin@127.0.0.1:50562/app-lane1
  SMTP_URL=smtp://127.0.0.1:20471
  ```

  The ports of the shared stores match lane 0's; only the SMTP port belongs to the lane's own Mailpit. Press **Write and read** on the Mailpit card of lane 1: the mail shows up at https://mail.multi-database1.localhost and not at https://mail.multi-database.localhost.
- Restart RabbitMQ with `docker compose -p multi-database restart rabbitmq`, then run `devlanes start --no-ui`. It prints `✓ setup` instead of `! setup skipped: already done`, because the `rabbitmq` entry sets `container: rabbitmq`, and `devlanes logs setup.rabbitmq` shows `Adding vhost "app_main" ...` again.
- Clean the second lane: `devlanes lane clean review --yes` prints `cleaned multi-database@1: stopped 1 unit, teardown postgres, redis, clickhouse, rabbitmq, s3`. `app_lane1`, index 1, the vhost and the `app-lane1` bucket with its objects are gone, lane 1's Mailpit container is removed, and lane 0's data is untouched.
- Remove everything this example created: `devlanes lane clean 0 --yes`, then `devlanes infra down` to stop the shared containers, then `docker compose -p multi-database down -v` to delete them with their volumes.

## Files

- `devlanes.yaml`: the per-lane names, setup and teardown for each store, console hostnames, the URLs in `global_env`, the `install` task and the `api` service.
- `docker-compose.yml`: the containers with pinned images, loopback ports and healthchecks, plus the `rc` S3 command line under a profile.
- `stores.mjs`: one entry per store with its namespace, health check and write-then-read.
- `server.mjs`: `/healthz`, `/lane`, the dashboard at `/` (JSON for other `Accept` headers), `GET /api/stores` and `POST /api/stores/<store>/try`.
- `devlanes.css`, `logo.svg`: the devlanes look, copied from `_template`.

## Docs

- [Infra guide](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/infra.md)
- [Ports and environment: expressions and `lanes.vars`](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/ports-and-env.md#expressions)
- [Config reference: `infra`](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#infra)
