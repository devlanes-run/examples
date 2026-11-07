# Forty services and the start gate

Forty copies of one small [Hono](https://hono.dev) server, split by `templates` into `api`, `web`, `worker` and `job` services, each with its own tag colour. Every service works for a random 1 to 6 seconds before it is ready, then burns a little CPU now and then, so a start fills the machine-wide start gate (`startup.*` in the user config) and the resource monitor (`M` in the TUI) has something to draw. `scripts/generate.ts` writes `devlanes.yaml`.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22.18 or later, which runs `scripts/generate.ts` without a build step (tested with Node 24 and npm 11)

## Run it

```sh
cd showcase-many-services
devlanes start
```

Open https://example-many-services.localhost. The index page lists all 40 services of lane 0 (one worktree's ports, hostnames and data) with a link to each, its kind, how long it took to get ready, its CPU bursts and CPU time. It asks every service for `/stats` and reloads every 2 seconds, so during a start you see the count of services that answer go up. `index`, `api-01` and `web-01` have hostnames; the other 37 are port-only, and the index links to their `http://127.0.0.1:<port>`.

## During a start

1. The first start of a lane runs the `install` task, `npm install && npm run build`, which compiles `src/` to `dist/`.
2. Every service runs `node dist/index.js` with `KIND`, `BOOT_MS`, `BURST_MS` and `BURST_EVERY_MS` from its template. It works for `BOOT_MS` before it listens on `PORT`.
3. Each service holds a slot in the start gate until its ready check passes: `ready.http` on `/healthz` for `api` and `web`, the log line `ready after` (`ready.log`) for `worker` and `job`.

The start gate decides how many services may be starting at the same time, across every lane and project on the machine. The rest wait as `queued`. With the default `startup.mode: adaptive`, the window starts at `startup.max`, which defaults to the number of CPU cores. It halves after 3 seconds above 90% CPU or under memory pressure, and grows by one slot every 2 seconds while system CPU stays below `startup.target_cpu` (75%).

On a 20-core machine, 20 services started and the rest queued. `devlanes status` a second into the start:

```text
example-many-services
  LANE  BRANCH  STATE     SERVICES  CPU   MEM      URL
  0     main    starting  14/40     468%  1.1 GiB  https://example-many-services.localhost

  UNIT       STATE       PORT   CPU   MEM       URL
  api-01     ready       20590  19%   40.6 MiB  https://api-01.example-many-services.localhost
  job-02     starting    20602  41%   40.8 MiB  http://127.0.0.1:20602
  web-09     queued 1/8  20618  –     –         http://127.0.0.1:20618
  worker-09  queued 2/8  20628  –     –         http://127.0.0.1:20628
  web-09: queued: 1 of 8 starting, CPU 94%, memory pressure normal
```

`queued 1/8` is the unit's place in the queue and the queue's length. The queue is shared by the whole machine, so it counts other projects' services too. `devlanes status --output json` has the numbers behind it in each queued unit's `reason`: `"in_flight": 20, "window": 20, "hold": "window_full"`.

Each starting service works in 40 ms slices, about 40% of a core, as `job-02` shows above. CPU is a share of one core, so a lane can pass 100%, and the lane row adds up its units. Once all 40 are up, the lane uses about 1 core and 1.2 GiB:

```text
  LANE  BRANCH  STATE    SERVICES  CPU  MEM      URL
  0     main    running  40/40     88%  1.2 GiB  https://example-many-services.localhost
```

In the TUI, api services are cyan, web green, workers magenta and jobs yellow (`tags` with `color`).

## Try next

- Press `M` in the TUI that `devlanes start` opened. The monitor shows every unit on the machine, grouped by lane, with CPU and memory graphs on top. `/` filters (type `example-many-services job` and Enter; every word has to match). `<-` and `->` move the sort through name, lane, kind, state, cpu, mem, peak and uptime, `i` reverses it, `e` switches to one flat list with a `lane` column, and Esc clears the filter. The box under the table graphs the selected lane.
- `devlanes debug top` prints CPU and memory per lane and unit for every lane on the machine:

  ```text
  example-many-services@0  cpu 88%  mem 1.2 GiB
    UNIT       CPU   MEM
    api-01     2.0%  40.8 MiB
    api-02     2.7%  41.1 MiB
    api-03     2.7%  40.7 MiB
  ```

- `devlanes stop`, then `devlanes start --no-ui --all-at-once`: the gate is skipped for that run and every service starts at once. On the same 20-core Windows machine, the gated start took 10.7 to 12.3 s (3 runs) and `--all-at-once` 6.9 to 7.3 s (3 runs), while the lane's CPU in `status` peaked at 1088% instead of 790%. The boot here is wall-clock time; a real dev server that compiles competes for the same cores and gains less.
- `devlanes config get startup` prints the gate settings (`null` means the default):

  ```text
  mode: adaptive
  initial: null
  max: null
  target_cpu: 75%
  settle_cpu: 10%
  slot_timeout: 20s
  reserve_memory: null
  ```

  To change them, edit `~/.devlanes/config.yaml` or use `devlanes config set startup.max 8`, `devlanes config set startup.initial 2` (ramp up from 2 slots), `devlanes config set startup.mode fixed`, `devlanes config set startup.target_cpu 50%` or `devlanes config set startup.slot_timeout 10s`, and `devlanes config unset startup.max` to go back. They apply to every project on the machine, so these commands were not run for this README.

- `devlanes logs worker-01 --tail 4` shows the bursts of a worker:

  ```text
  worker-01#34 handled batch 2 in 295 ms
  worker-01#35 handled batch 3 in 164 ms
  worker-01#36 handled batch 4 in 213 ms
  worker-01#37 handled batch 5 in 247 ms
  ```

- `node scripts/generate.ts 12` rewrites `devlanes.yaml` with 12 services (`devlanes config check` accepts it) and `node scripts/generate.ts` brings back 40. Run `devlanes stop` and `devlanes start` afterwards.
- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/showcase-many-services && devlanes start`. Its index is at https://example-many-services1.localhost. This step was not run for this README. In the same folder, `devlanes lane new --name example-many-services-review --start --no-ui` gives lane 1 without a worktree:

  ```text
  ✓ install
  created example-many-services@1 named example-many-services-review (main) at D:\acme\examples
  example-many-services@1 · main
  ✓ services  40 of 40 ready
    ✓  index      https://example-many-services1.localhost
    ✓  api-01     https://api-01.example-many-services1.localhost
  ```

  Both lanes' 80 services go through the same gate, and the index on https://example-many-services1.localhost says `This is lane 1 of example-many-services.`

- `devlanes lane clean example-many-services-review --yes` and `devlanes lane clean 0 --yes` stop both lanes and free their ports.

On Windows, `devlanes stop` reports each service as `exit=-1073741510`, Windows' exit status for a process ended by Ctrl-C.

## Files

- `devlanes.yaml`: the `install` task, the tags, the `node`, `api`, `web`, `worker` and `job` templates and 40 services. Generated; do not edit it by hand.
- `scripts/generate.ts`: writes `devlanes.yaml` from `scripts/base.yaml` (everything but the services); `node scripts/generate.ts [count]`.
- `src/index.ts`: boots, listens and starts the CPU bursts for the kind `KIND` names.
- `src/kinds/`: what each kind adds (`api`, `web`, `worker`, `job`).
- `src/load.ts`: the boot and the CPU bursts.
- `src/views/`: the index page listing every service and the page of a `web` service.
- `brand`: a link to `_internal/brand`, the CSS and logo all examples share.

## Docs

- [Config reference: startup](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/config.md#startup)
- [CLI reference: devlanes start](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/cli.md#devlanes-start)
- [CLI reference: devlanes debug top](https://github.com/devlanes-run/devlanes/blob/main/docs/reference/cli.md#devlanes-debug-top)
- [TUI](https://github.com/devlanes-run/devlanes/blob/main/docs/getting-started.md#tui)
- [Tags, profiles and templates](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#tags-profiles-and-templates)
