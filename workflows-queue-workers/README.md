# Queue workers per lane

An API that puts jobs on a Redis list and two worker processes that take them, with a page that shows which worker finished each job. The workers have no port and finish the job in hand before they stop, and each lane keeps its own queue in a shared Redis.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 22 or later
- Docker with Compose

## Run it

```sh
cd workflows-queue-workers
devlanes start
```

`devlanes start --no-ui` prints the start as text:

```text
example-queue-workers@0 (main): 3/3 ready
ready api http://127.0.0.1:20570 https://example-queue-workers.localhost
ready worker.1 http://127.0.0.1:20571
ready worker.2 http://127.0.0.1:20572
```

Each replica gets a port it does not use. Open https://example-queue-workers.localhost. The page shows this lane's queue, the two workers and a table of finished jobs that refreshes every second. "Enqueue jobs" adds jobs of 2 seconds each. The same queue answers `curl`:

```sh
curl -fsS -X POST "https://example-queue-workers.localhost/api/jobs?count=6" # add --ssl-revoke-best-effort on Windows
curl -fsS https://example-queue-workers.localhost/api/jobs
```

## During a start

1. Redis starts once in the shared Compose project `example-queue-workers` (`infra.project_name`) on an ephemeral loopback port, which `REDIS_URL` reads as `${{ infra.redis.port }}`.
2. The `install` task runs `npm install` at the example root on the lane's first start.
3. `api` runs `npm run dev` in `apps/api` and is ready when `/healthz` answers.
4. `worker` runs as two units, `worker.1` and `worker.2`, each with `WORKER_ID` from `${{ replica.index }}`. `ready.log` is `worker ${{ replica.index }} ready`, so each replica waits for its own line. The worker's `dev` script runs `tsx` without `watch`, because `tsx watch` kills its child on a stop before the job in hand finishes.
5. Every process gets `QUEUE_PREFIX` from `queue_prefix: jobs:${{ lane.name }}`, so lane 0 uses `jobs:main`.

After enqueuing 6 jobs, `devlanes logs worker.1` shows the jobs this replica took. `worker.2` took 2, 3 and 5:

```text
worker.1#5 worker 1 ready, waiting on jobs:main:waiting
worker.1#6 worker.1 started job 1
worker.1#7 worker.1 finished job 1 in 2001 ms
worker.1#8 worker.1 started job 4
worker.1#9 worker.1 finished job 4 in 2001 ms
worker.1#10 worker.1 started job 6
worker.1#11 worker.1 finished job 6 in 2000 ms
```

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/workflows-queue-workers && devlanes start`. The page there shows lane 1 at `example-queue-workers1.localhost`, with its own `jobs:<lane name>` prefix.
- In the same folder, `devlanes lane new --name example-queue-workers-review --start --no-ui` gives a second lane without a worktree:

  ```text
  created example-queue-workers@1 named example-queue-workers-review (main) at C:\Users\acme\examples
  example-queue-workers@1 (main): 3/3 ready
  ready api http://127.0.0.1:20570 https://example-queue-workers1.localhost
  ready worker.1 http://127.0.0.1:20571
  ready worker.2 http://127.0.0.1:20572
  ```

  Names given with `--name` are unique per folder across projects, so pick another one if it is taken.

- Enqueue jobs at https://example-queue-workers1.localhost. The lane's `lane.name` is `lane1`, so its queue is `jobs:lane1` and the jobs go to lane 1's workers only. Redis holds both lanes' keys:

  ```sh
  docker compose -p example-queue-workers exec -T redis redis-cli --scan --pattern 'jobs:*'
  ```

  ```text
  jobs:lane1:done
  jobs:lane1:next_id
  jobs:lane1:workers
  jobs:main:done
  jobs:main:next_id
  jobs:main:workers
  ```

- Try to freeze the lane with `devlanes debug freeze`. The running workers keep it awake, so it refuses and exits 1:

  ```text
  error: lane example-queue-workers@0 runs keep_awake services (worker.1, worker.2), so it stays awake
  hint: set services.worker.1.keep_awake and services.worker.2.keep_awake to false in the project config to let it freeze
  ```

  The key to change is `services.worker.keep_awake`; the hint names each replica. Without `keep_awake`, a lane whose only traffic is jobs would freeze after `lanes.freeze_after` and its workers would stop taking jobs.

- Enqueue 10 jobs, then stop the workers while they work. `devlanes stop worker` answers `worker not found`, because each replica is its own unit. Select them by tag with `devlanes stop +worker`:

  ```text
  stopped example-queue-workers@0:worker.1 exit=1
  stopped example-queue-workers@0:worker.2 exit=1
  ```

  `devlanes logs worker.1 worker.2 --tail 8` ends with each worker finishing its job before it exits:

  ```text
  worker.2#15 worker.2 got SIGINT, finishing job 9 first
  worker.1#15 worker.1 got SIGINT, finishing job 10 first
  worker.2#16 Terminate batch job (Y/N)?
  worker.1#16 Terminate batch job (Y/N)?
  worker.1#17 worker.1 finished job 10 in 2000 ms
  worker.2#17 worker.2 finished job 9 in 2001 ms
  worker.1#18 worker.1 stopped cleanly, jobs:main keeps the waiting jobs for the next start
  worker.2#18 worker.2 stopped cleanly, jobs:main keeps the waiting jobs for the next start
  ```

  That log is from Windows, which has no POSIX signals. devlanes sends `SIGINT` as Ctrl-C, and as Ctrl-Break for a `run:` string, whose programs ignore Ctrl-C. This example uses `run_script`, so Node gets Ctrl-C and raises its `SIGINT` event as on macOS and Linux. npm's `npm.cmd` runs under `cmd.exe`, which prints `Terminate batch job (Y/N)?` and makes the stop report `exit=1`; the job still finishes.

- `devlanes start +worker` brings both workers back, and they take the jobs that were left waiting. A worker that was killed mid-job puts that job back on the queue when it starts again.
- Drop the finished-job records with `devlanes run cleanup`. Cron-like jobs are tasks, since a service that exits shows as failed:

  ```text
  cleanup removed 16 finished jobs from jobs:main:done
  ```

- Clean lane 1 with `devlanes lane clean example-queue-workers-review --yes`. `infra.teardown.queue` deletes the `jobs:lane1:*` keys and leaves lane 0's queue:

  ```text
  cleaned example-queue-workers@1: stopped 3 units, teardown queue
  ```

- Clean up everything: `devlanes lane clean 0 --yes` deletes lane 0's keys. Redis outlives every lane, so remove it with `docker compose -p example-queue-workers down -v`.

## Files

- [`devlanes.yaml`](devlanes.yaml): the queue prefix in `lanes.vars`, the teardown entry, `REDIS_URL` and `QUEUE_PREFIX` in `global_env`, the `install` and `cleanup` tasks, `api` and the `worker` replicas.
- [`docker-compose.yml`](docker-compose.yml): Redis with a pinned tag, an ephemeral loopback port and a healthcheck.
- [`packages/queue/`](packages/queue): the typed queue both apps use, with every Redis key under the lane's prefix.
- [`apps/api/src/`](apps/api/src): the Hono server with the page, the enqueue form and `/api/jobs`.
- [`apps/worker/src/index.ts`](apps/worker/src/index.ts): connects, takes jobs with `BLMOVE`, prints the ready line and finishes its job on `SIGINT`.
- [`apps/worker/src/scripts/cleanup.ts`](apps/worker/src/scripts/cleanup.ts): the `cleanup` task.

## Docs

- [Workers and consumers](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#workers-and-consumers)
- [Replicas](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#replicas)
- [Keeping a lane awake](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#keeping-a-lane-awake)
- [Lifecycle tasks](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#lifecycle-tasks)
- [Stopping units on Windows](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/windows.md#stopping-units)
- [Infra setup and teardown](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/infra.md#setup-and-teardown)
