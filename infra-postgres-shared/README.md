# Shared Postgres with a database per lane

A Node notes API backed by one Postgres container that every lane shares. Each lane gets its own database in it, created by `infra.setup` and dropped by `infra.teardown`, with `migrate` on `lane.start`, `seed` with `after: services`, and a `reset-db` task built from `steps` and `confirm`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 24 and npm 11
- Docker with Compose v2

## Run it

```sh
cd infra-postgres-shared
devlanes start
```

Open https://postgres-shared.localhost. The page shows lane 0 of `postgres-shared`, its database `postgres_shared_main`, the notes in it and a form to add one. `/api/notes` returns the notes as JSON and `/lane` the lane's values.

## During a start

The first start of lane 0, with `devlanes start --no-ui --output plain`:

```text
ok infra
ok setup
ok install
ok migrate
ok seed
postgres-shared@0 · main
ok services  1 of 1 ready
  ok  api  https://postgres-shared.localhost
```

1. Infra: devlanes runs `docker-compose.yml` as the Compose project `postgres-shared` (`infra.project_name`) and waits for the healthcheck. Postgres is published on an ephemeral loopback port, read back as `${{ infra.postgres.port }}`.
2. Setup: `infra.setup.database` creates `${{ lane.db_name }}` (`postgres_shared_main` in lane 0, `postgres_shared_lane1` in lane 1) through `docker compose exec`, so the host needs no `psql`. It runs once per lane; later starts print `skipped setup: already done`.
3. `lane.create` tasks: `install` runs `npm ci`. It runs on each start until it succeeds once for the lane.
4. `lane.start` tasks: `migrate` creates the `notes` table if it is missing, on every start.
5. Services: `api` starts with `DATABASE_URL` from `global_env` and becomes ready when `/healthz` answers.
6. `after: services` tasks: `seed` posts two notes to `${{ services.api.url }}/api/notes`, so the notes go through the running API. The plain output above lists `ok seed` with the other tasks, but `devlanes debug events` shows it starting after `api ready`.

The `lane`, `branch`, `service` and `port` rows on the page come from `DEVLANES_LANE`, `DEVLANES_LANE_NAME`, `LANE_LABEL`, `DEVLANES_SERVICE` and `PORT`, `url` from the `X-Forwarded-Host` header the proxy sends, and the database name from `DATABASE_URL`.

## Try next

- Start a second lane from the same folder: `devlanes lane new --name review --start`. It is lane 1 at https://postgres-shared1.localhost, with its own seeded notes. Both databases sit in the one container:

  ```sh
  docker compose -p postgres-shared exec postgres psql -U postgres -Atc "SELECT datname FROM pg_database WHERE datname LIKE 'postgres_shared_%'"
  ```

  ```text
  postgres_shared_lane1
  postgres_shared_main
  ```

- Add a note with the form, then run `devlanes run reset-db --yes`. It drops the lane's database, creates it again, migrates and seeds, and the page is back to the two seeded notes. Without `--yes` and without a terminal to ask on, it stops with `task reset-db asks: Drop postgres_shared_main and seed it again?; rerun with --yes`. `dropdb --force` ends the API's open connections, which `api` logs as `pool: terminating connection due to administrator command` and recovers from.
- `devlanes stop` stops `api` only. `devlanes infra status` still shows postgres as `healthy`, and the next `devlanes start` prints `skipped setup: already done`.
- `devlanes lane clean review --yes` prints `cleaned postgres-shared@1: stopped 1 unit, teardown database`. The query above then lists only `postgres_shared_main`, and lane 0 keeps running.
- With the lanes stopped, `devlanes infra down` stops the container and keeps the `postgres-shared_pgdata` volume. The next `devlanes start` brings it back with the notes still there.
- To remove everything: `devlanes lane clean 0 --yes`, then `docker compose -p postgres-shared down -v` for the shared container and its volume, which `lane clean` leaves in place.

## Files

- `devlanes.yaml`: the per-lane `db_name`, the shared Compose infra with its setup and teardown, `DATABASE_URL`, the tasks and the `api` service.
- `docker-compose.yml`: Postgres 17 on an ephemeral loopback port, with a named volume and a healthcheck.
- `server.mjs`: the API and the lane page (`/`, `/notes`, `/api/notes`, `/lane`, `/healthz`).
- `migrate.mjs`: creates the `notes` table when it is missing.
- `seed.mjs`: posts the first notes through the API.
- `devlanes.css`, `logo.svg`: the devlanes look for the page.

## Docs

- [Infra](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/infra.md)
- [Lane lifecycle](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md)
- [Config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md)
