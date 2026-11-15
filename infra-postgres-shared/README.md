# Shared Postgres with a database per lane

A TypeScript notes API built with [Hono](https://hono.dev) and backed by one Postgres container that every lane shares. Each lane gets its own database in it, migrated on every start and seeded through the running API.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later
- Docker with Compose v2

## Run it

```sh
cd infra-postgres-shared
devlanes start
```

Open https://example-postgres-shared.localhost. The page says `This is lane 0 of example-postgres-shared.`, names its database `example_postgres_shared_main`, lists the notes in it and has a form to add one.

## During a start

The first start of lane 0, with `devlanes start --no-ui --output plain`:

```text
ok infra
ok setup
ok install
ok migrate
ok seed
example-postgres-shared@0 · main
ok services  1 of 1 ready
  ok  api  https://example-postgres-shared.localhost
```

1. Infra: devlanes runs `docker-compose.yml` as the Compose project `example-postgres-shared` (`infra.project_name`, set from the project name) and waits for the healthcheck. Postgres is published on an ephemeral loopback port, read back as `${{ infra.postgres.port }}`.
2. Setup: `infra.setup.database` creates `${{ lane.db_name }}` (`example_postgres_shared_main` in lane 0, `example_postgres_shared_lane1` in lane 1) through `docker compose exec`, so the host needs no `psql`. It runs once per lane; later starts print `skipped setup: already done`.
3. `lane.create` tasks: `install` runs `npm install` on each start until it succeeds once for the lane.
4. `lane.start` tasks: `migrate` runs `npm run db:migrate`, which applies the SQL files in `src/migrations/` that the `schema_migrations` table does not list yet. The first start logs `applied 001_create_notes.sql`, later ones `0 applied, 1 already there`.
5. Services: `api` runs `npm run dev` (`tsx watch src/index.ts`) with `DATABASE_URL` from `global_env` and becomes ready when `/healthz` answers.
6. `after: services` tasks: `seed` runs `npm run db:seed`, which posts two notes to `${{ services.api.url }}/api/notes`, so the notes go through the running API. The plain output above lists `ok seed` with the other tasks, but `devlanes debug events` shows `task example-postgres-shared@0 seed started` after `unit.changed example-postgres-shared@0:api ready`.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/infra-postgres-shared && devlanes start`. In the same folder, `devlanes lane new --name example-postgres-shared-review --start` gives lane 1 without a worktree. Lane 1 answers at https://example-postgres-shared1.localhost with its own seeded notes, and both databases sit in the one container:

  ```sh
  docker compose -p example-postgres-shared exec postgres psql -U postgres -Atc "SELECT datname FROM pg_database WHERE datname LIKE 'example_postgres_shared_%' ORDER BY datname"
  ```

  ```text
  example_postgres_shared_lane1
  example_postgres_shared_main
  ```

- Add a note with the form, then run `devlanes run reset-db --yes`. It drops the lane's database, creates it again, migrates and seeds, and the page is back to the two seeded notes. `api` logs `pool: terminating connection due to administrator command` and recovers.
- Run `devlanes run reset-db` without `--yes` and without a terminal to ask on. It stops with `task reset-db asks: Drop example_postgres_shared_main and seed it again?; rerun with --yes`.
- `devlanes stop` stops `api` only. `devlanes infra status` still shows postgres as `healthy`, and the next `devlanes start` prints `skipped setup: already done`.
- `devlanes lane clean example-postgres-shared-review --yes` prints `cleaned example-postgres-shared@1: stopped 1 unit, teardown database`. The query above then lists only `example_postgres_shared_main`, and lane 0 keeps running. For the worktree's lane, run it with `1`.
- With the lanes stopped, `devlanes infra down` stops the container and keeps the `example-postgres-shared_pgdata` volume. The next `devlanes start` brings it back with the notes still there.
- To remove everything: `devlanes lane clean 0 --yes`, then `docker compose -p example-postgres-shared down -v` for the shared container and its volume, which `lane clean` leaves in place.

## Files

- [`devlanes.yaml`](devlanes.yaml): the per-lane `db_name`, the shared Compose infra with its setup and teardown, `DATABASE_URL`, the tasks and the `api` service.
- [`docker-compose.yml`](docker-compose.yml): Postgres 17 on an ephemeral loopback port, with a named volume and a healthcheck.
- [`src/app.ts`](src/app.ts): the routes, with the pages in [`src/routes/pages.tsx`](src/routes/pages.tsx) and the JSON API in [`src/routes/api.ts`](src/routes/api.ts).
- [`src/db.ts`](src/db.ts) and [`src/notes.ts`](src/notes.ts): the connection pool and the notes queries.
- [`src/scripts/migrate.ts`](src/scripts/migrate.ts) and [`src/migrations/`](src/migrations): the migrations the `migrate` task applies.
- [`src/scripts/seed.ts`](src/scripts/seed.ts): posts the first notes through the API.

## Docs

- [Infra](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/infra.md)
- [Lane lifecycle](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md)
- [Config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md)
