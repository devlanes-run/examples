# A tour of the TUI

The stack from the devlanes.run TUI demo, run for real so you can walk through the TUI on it: `api`, `web` (Vite) and `worker` in Node, a shared Postgres and Redis with a database and a Redis index per lane (`infra.setup`, `infra.teardown`), Mailpit per lane (`infra.per_lane`, `infra.hosts`), `migrate` on `lane.start` and `seed` with `after: services`, three `profiles`, a `flaky` service with `autostart: false` that crashes, and an ad-hoc unit from `devlanes exec`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 24 and npm 11
- Docker with Compose v2 (2.24.4 or newer, for `infra.per_lane`)

## Run it

```sh
cd showcase-tui-tour
devlanes start
```

`devlanes start` opens the TUI on lane 0 and runs the start inside it. Open https://tui-tour.localhost. The page shows lane 0 of `tui-tour`, the orders `api` reads from the lane's database, and a form that sends a mail: `api` puts it on the lane's Redis queue, `worker` sends it over SMTP, and it lands in the lane's own Mailpit at https://mail.tui-tour.localhost.

## During a start

The first start of lane 0, with `devlanes start --no-ui --output plain`:

```text
ok infra
ok setup
ok install
ok migrate
ok seed
tui-tour@0 · main
ok services  3 of 3 ready
  ok  api     https://api.tui-tour.localhost
  ok  web     https://tui-tour.localhost
  ok  worker  http://127.0.0.1:20683
```

1. Infra: the Compose project `tui-tour` runs Postgres and Redis for every lane. Mailpit is in `infra.per_lane`, so each lane runs its own in `tui-tour-lane0`, `tui-tour-lane1` and so on, and `infra.hosts` routes `mail.<lane domain>` to its web port.
2. Setup: `database` creates `tui_tour_main` in the shared Postgres, and `redis` writes `lane:owner` into Redis index 0 (the lane index). `devlanes lane clean` runs the matching `teardown` entries.
3. Tasks: `install` runs `npm install` until it succeeds once for the lane, and `migrate` creates the `orders` table on every start.
4. Services: `api` is ready when `/healthz` answers, `web` (`preset: vite`) when `/` does, and `worker`, which has no port to probe, when it prints `worker ready:`. `flaky` has `autostart: false` and stays stopped.
5. `seed` (`after: services`) posts three orders through the running `api`.

`api.tui-tour.localhost` answers `/`, `/lane`, `/api/orders` and `/api/mail` with JSON. The page reads the lane values from the `VITE_*` variables in `devlanes.yaml`.

## Try next: a tour of the TUI

Each step happens in the TUI that `devlanes start` opened; run the `devlanes` commands from a second terminal in the same folder. `?` lists every key.

1. The start. While the lane starts, the top bar names the current step, such as `starting tui-tour@0: migrate`, the services wait as `… api  queued · waiting for containers`, and the lane's pane lists the phases. On the first start, a few seconds in:

   ```text
   main @0 · starting · 3 of 7 ready
     ✓ infra      3 of 3 healthy
     ✓ setup      database (2 of 2)
     ⠙ tasks      install (1 of 2)

   queued    api, web, worker: waiting for install
   x stops the start. Select a unit to watch its output.
   ```

   When it ends the top bar says `tui-tour@0 up: 3 of 3 services ready`.

2. The lane's details. The lane is selected first, and the pane shows its `branch`, `worktree`, `profile`, `domain`, `ports`, how many services are up, `tasks 3 done`, `setup 2 of 2 done` and the `infra` ports. `j` and `k` move through the list: `services` shows a table of state, CPU, memory and URL, and `api` shows its live output under the title `api  ready`, marked `watching · enter types`. `g` goes back to the lane, `t` to the tasks and `i` to the infra.
3. Zoom. On `api`, `z` gives the pane the whole screen, and `z` again brings the list back.
4. Typing. Select `web` and press Enter. The footer turns into `TYPING into web · keys go to the program · esc or ctrl+] returns to the list`. Type `h` and Enter, and Vite prints its `Shortcuts` list. Esc returns to the list.
5. Profiles. `g`, then `p`, opens the picker:

   ```text
   start tui-tour@0 with profiles
   [x] default  default           +api, +web, +worker
   [ ] backend                    +api, +worker
   [ ] everything                  *, flaky

   With none checked, enter starts the default profile.

   space check   enter start   esc cancel
   ```

   `everything` names `flaky`, since `*` skips services with `autostart: false`. Esc closes the picker.

6. Restart. Select `worker` and press `r`. The row shows `· worker` and the pane title `worker  stopped`, then `● worker` again with a new `worker ready:` line. On Windows the old output ends with `^CTerminate batch job (Y/N)? Y`, from the batch file npm runs through.
7. Infra. `i` selects the infra section: `containers` holds this lane's `mailpit`, `shared` holds `postgres` and `redis`, and `▸ setup  2 done` is folded. Selecting a container shows its Docker logs, with its host ports in the title and `docker logs` on the right of the border. `l` on `setup` unfolds `database` and `redis`. On `database` the pane reads `database  setup.database · done · 4m ago` above the `CREATE DATABASE` its first run printed, and `s` runs it again: the title turns to `done · just now`.
8. Monitor. `M` shows CPU and memory graphs for the machine and a table of every unit of every lane on it, `tui-tour` included. `M` again returns.
9. Daemon. `D` shows the daemon's version, pid and uptime, its checks and `daemon.log` as it follows. Esc returns.
10. A failure. Select `flaky` (`· flaky`) and press `s`. It prints a batch line every 2 seconds and crashes on the tenth batch. The row turns into `✕ flaky  failed · exit 1` and the pane explains it above the last output:

    ```text
    failed    exited with code 1 just now, 20s after start
    reason    exited: code=1 signal=null
    next      r restarts it
              devlanes logs tui-tour@0:flaky prints the whole log
    ```

    The last output ends with `TypeError: Cannot read properties of undefined (reading 'orders')` and its stack trace. devlanes never restarts it. From anywhere in the list, `n` jumps to the next problem, here `flaky`. The lane now counts `flaky` among the services it runs, so a later plain `devlanes start` starts it again too.

11. An ad-hoc unit. In the second terminal:

    ```sh
    devlanes exec --name load -- npm run load
    ```

    ```text
    ready tui-tour@0:load pid=32228
      logs: devlanes logs tui-tour@0:load -f
      stop: devlanes stop tui-tour@0:load
    ```

    An `▾ ad-hoc  1 running` group appears at the end of the services with `◉ load` in it, and `api`'s output fills with `GET /api/orders 200 1ms` once a second. `devlanes stop load` stops it and leaves the row as `· load`. The `load` script runs Node with `--use-system-ca`, because devlanes 0.11.3 does not give exec units `NODE_EXTRA_CA_CERTS`.

12. A second lane. A worktree is a lane:

    ```sh
    git worktree add ../examples-checkout -b feat/checkout
    cd ../examples-checkout/showcase-tui-tour
    devlanes start
    ```

    This step was not run while writing this README. What follows comes from the other way to get a second lane, `devlanes lane new --name tui-tour-review --start --no-ui` in the same folder, which prints `created tui-tour@1 named tui-tour-review (main)` after the same `ok` lines as above. The TUI grows a lane bar, `lanes  1 main  2 tui-tour-review` with `1-9 or [ ] switch lanes` on the right, and the lane's pane lists both lanes under `lanes in tui-tour`. `]` or `2` switches to lane 1, whose `api` says `connected to postgres (tui_tour_lane1)` and `connected to redis (db 1)`. Its page is https://tui-tour1.localhost and its inbox https://mail.tui-tour1.localhost. `[` or `1` goes back.

13. Freeze and thaw. With `load` stopped (while it runs, freeze answers `error: lane tui-tour@0 is starting, stopping or running a task; retry when it is done`):

    ```sh
    devlanes debug freeze
    ```

    ```text
    frozen tui-tour@0
      a request, a connection or a command thaws it, or run devlanes debug thaw tui-tour@0
    ```

    The list title becomes `@0 frozen · 7/7 up`, every running service shows `❄` instead of its dot, `api`'s pane title reads `api  ❄ frozen`, and the lane's pane adds `idle  frozen since 23:43 UTC, last activity a stop at 23:43 UTC`. `worker` has no `keep_awake`, so it does not hold the lane awake. `devlanes debug thaw` prints `thawed tui-tour@0` and the dots come back.

14. Quit. `q` closes the TUI and prints where things stand:

    ```text
    Lane      tui-tour@0  failed, 6/7 up, 1 failed
    Daemon    running, 2 lanes running
    Stop      devlanes stop --lane tui-tour@0
    ```

    Everything keeps running in the daemon, and `devlanes start` opens the TUI on the lane again. This run had `tui.on_quit: keep` in `~/.devlanes/config.yaml`; with the default, `ask`, `q` first asks whether to keep the lanes or stop them.

To remove it all:

```sh
devlanes lane clean tui-tour-review --yes
devlanes lane clean 0 --yes
docker compose -p tui-tour down -v
```

The first prints `cleaned tui-tour@1: stopped 3 units, teardown database, redis`: it drops `tui_tour_lane1`, flushes Redis index 1 and removes the lane's Mailpit, while lane 0 keeps running. `docker compose -p tui-tour down -v` removes the shared Postgres and Redis with their volumes, which `lane clean` leaves in place.

## Files

- `devlanes.yaml`: the per-lane names, the Compose infra with setup and teardown, the tasks, four services and three profiles.
- `docker-compose.yml`: Postgres and Redis (shared) and Mailpit (per lane), each with a healthcheck.
- `api.mjs`: the JSON API over Postgres and Redis, with CORS from `DEVLANES_ORIGINS`.
- `worker.mjs`: takes mail jobs off the Redis queue and sends them to Mailpit.
- `flaky.mjs`: the report job that crashes about 20 seconds in.
- `migrate.mjs`, `seed.mjs`: the `orders` table, and three orders posted through `api`.
- `load.mjs`: the ad-hoc unit for `devlanes exec`.
- `web/`: the Vite page (`index.html`, `main.js`) with `devlanes.css` and `public/logo.svg`.

## Docs

- [Getting started](https://github.com/devlanes-run/devlanes/blob/main/docs/getting-started.md)
- [Infra](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/infra.md)
- [Lane lifecycle](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md), including [idle lanes](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#idle-lanes)
- [Tags, profiles and templates](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#tags-profiles-and-templates)
- [CLI reference: exec, debug freeze, debug thaw](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/cli.md)
