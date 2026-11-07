# Shared Postgres with a database per lane

A TypeScript notes API built with [Hono](https://hono.dev) and backed by one Postgres container that every lane shares. Each lane gets its own database in it, created by `infra.setup` and dropped by `infra.teardown`, with `migrate` on `lane.start`, `seed` with `after: services`, and a `reset-db` task built from `steps` and `confirm`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later (tested with Node 24 and npm 11)
- Docker with Compose v2

## Run it

```sh
cd infra-postgres-shared
devlanes start
```

Open https://example-postgres-shared.localhost. The page says `This is lane 0 of example-postgres-shared.`, names its database `example_postgres_shared_main`, lists the notes in it and has a form to add one. https://example-postgres-shared.localhost/api/notes returns the notes as JSON and `/lane` the lane's values.

## During a start

devlanes calls each worktree of the repository a lane. A fresh clone on `main` is lane 0, named `main`. The first start of lane 0, with `devlanes start --no-ui --output plain`:

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
3. `lane.create` tasks: `install` runs `npm install`, because a new worktree has no `node_modules`. It runs on each start until it succeeds once for the lane.
4. `lane.start` tasks: `migrate` runs `npm run db:migrate`, which applies the SQL files in `src/migrations/` that the `schema_migrations` table does not list yet. The first start logs `applied 001_create_notes.sql`, later ones `0 applied, 1 already there`.
5. Services: `api` runs `npm run dev` (`tsx watch src/index.ts`) with `DATABASE_URL` from `global_env` and becomes ready when `/healthz` answers.
6. `after: services` tasks: `seed` runs `npm run db:seed`, which posts two notes to `${{ services.api.url }}/api/notes`, so the notes go through the running API. The plain output above lists `ok seed` with the other tasks, but `devlanes debug events` shows `task example-postgres-shared@0 seed started` after `unit.changed example-postgres-shared@0:api ready`.

`src/env.ts` reads what devlanes set: `DEVLANES_LANE` and `DEVLANES_LANE_NAME` for the lane, `LANE_LABEL` for the branch, `DEVLANES_SERVICE` and `PORT`, and the database name from `DATABASE_URL`. The `url` row comes from the `X-Forwarded-Host` header the proxy adds. The form only accepts posts from the lane's own origins, which devlanes lists in `DEVLANES_ORIGINS`.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/infra-postgres-shared && devlanes start`. This step was not run for this README. In the same folder, `devlanes lane new --name example-postgres-shared-review --start` gives lane 1 without a worktree. Either way lane 1 answers at https://example-postgres-shared1.localhost with its own seeded notes, and both databases sit in the one container:

  ```sh
  docker compose -p example-postgres-shared exec postgres psql -U postgres -Atc "SELECT datname FROM pg_database WHERE datname LIKE 'example_postgres_shared_%' ORDER BY datname"
  ```

  ```text
  example_postgres_shared_lane1
  example_postgres_shared_main
  ```

- Add a note with the form, then run `devlanes run reset-db --yes`. It drops the lane's database, creates it again, migrates and seeds, and the page is back to the two seeded notes. Without `--yes` and without a terminal to ask on, it stops with `task reset-db asks: Drop example_postgres_shared_main and seed it again?; rerun with --yes`. `dropdb --force` ends the API's open connections, which `api` logs as `pool: terminating connection due to administrator command` and recovers from.
- `devlanes stop` stops `api` only. `devlanes infra status` still shows postgres as `healthy`, and the next `devlanes start` prints `skipped setup: already done`.
- `devlanes lane clean example-postgres-shared-review --yes` prints `cleaned example-postgres-shared@1: stopped 1 unit, teardown database`. The query above then lists only `example_postgres_shared_main`, and lane 0 keeps running. For the worktree's lane, run it with `1`.
- With the lanes stopped, `devlanes infra down` stops the container and keeps the `example-postgres-shared_pgdata` volume. The next `devlanes start` brings it back with the notes still there.
- To remove everything: `devlanes lane clean 0 --yes`, then `docker compose -p example-postgres-shared down -v` for the shared container and its volume, which `lane clean` leaves in place.

## Files

- `devlanes.yaml`: the per-lane `db_name`, the shared Compose infra with its setup and teardown, `DATABASE_URL`, the tasks and the `api` service.
- `docker-compose.yml`: Postgres 17 on an ephemeral loopback port, with a named volume and a healthcheck.
- `src/app.ts`: the routes, with the pages in `src/routes/pages.tsx` and the JSON API in `src/routes/api.ts`.
- `src/db.ts` and `src/notes.ts`: the connection pool and the notes queries.
- `src/scripts/migrate.ts` and `src/migrations/`: the migrations the `migrate` task applies.
- `src/scripts/seed.ts`: posts the first notes through the API.
- `src/views/`: the page as JSX components (`Layout`, `LaneCard`, `NotesCard`, `HomePage`).
- `brand`: a link to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [Infra](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/infra.md)
- [Lane lifecycle](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md)
- [Config reference](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md)
