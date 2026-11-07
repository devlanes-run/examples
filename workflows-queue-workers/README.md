# Queue workers per lane

An API that puts jobs on a Redis list and two worker processes that take them, with a page that shows which worker finished each job. Each worktree of the repository is a lane with its own ports, hostname and queue. The workers have no port: they use `ready.log`, `replicas: 2`, `pty: false`, `keep_awake: true` and `stop: { signal: SIGINT, timeout: 15s }` to finish the job in hand before they exit. Redis is shared by every lane; each lane's keys start with a prefix from `lanes.vars`, and `infra.teardown` deletes them. A `cleanup` task runs on demand.

## Requirements

- devlanes, with `devlanes setup` run once
- Node 24
- Docker with Compose

## Run it

```sh
cd workflows-queue-workers
devlanes start
```

Open https://queue-workers.localhost. The page shows lane 0 of `queue-workers`, this lane's queue, the two workers and a table of finished jobs that refreshes every second. "Enqueue jobs" adds jobs of 2 seconds each. The same routes answer `curl`:

```sh
curl -fsS -X POST "https://queue-workers.localhost/api/jobs?count=6"   # add --ssl-revoke-best-effort on Windows
curl -fsS https://queue-workers.localhost/api/jobs
```

## During a start

1. Infra. Redis starts once in the shared Compose project `queue-workers` (`infra.project_name`) on an ephemeral loopback port, which `REDIS_URL` reads as `${{ infra.redis.port }}`.
2. The `install` task runs `npm ci` on the lane's first start.
3. `api` starts and is ready when `/healthz` answers. `worker` runs as two units, `worker.1` and `worker.2`, each with `WORKER_ID` from `${{ replica.index }}`. `ready.log` is `worker ${{ replica.index }} ready`, so each replica waits for its own line.
4. Every process gets `QUEUE_PREFIX` from `queue_prefix: jobs:${{ lane.name }}`, so lane 0 uses `jobs:main`.

`devlanes start --no-ui` prints the same steps as text:

```text
✓ infra
✓ install
queue-workers@0 · main
✓ services  3 of 3 ready
  ✓  api       https://queue-workers.localhost
  ✓  worker.1  http://127.0.0.1:20511
  ✓  worker.2  http://127.0.0.1:20512
```

Each replica gets a port it does not use. After enqueuing 6 jobs, `devlanes logs worker.1` shows the jobs this replica took; `worker.2` took 2, 4 and 6:

```text
worker.1#5 worker 1 ready, waiting on jobs:main:waiting
worker.1#6 worker.1 started job 1
worker.1#7 worker.1 finished job 1 in 2001 ms
worker.1#8 worker.1 started job 3
worker.1#9 worker.1 finished job 3 in 2000 ms
worker.1#10 worker.1 started job 5
worker.1#11 worker.1 finished job 5 in 2000 ms
```

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/workflows-queue-workers && devlanes start`. The page there shows lane 1 at `queue-workers1.localhost`, with its own `jobs:<lane name>` prefix. This step was not run for this README. In the same folder, `devlanes lane new --name queue-workers-review --start --no-ui` gives a second lane without a worktree:

  ```text
  ✓ infra
  ✓ install
  queue-workers@1 · main
  ✓ services  3 of 3 ready
    ✓  api       https://queue-workers1.localhost
    ✓  worker.1  http://127.0.0.1:20661
    ✓  worker.2  http://127.0.0.1:20662
  ```

  Names given with `--name` are unique per folder across projects, so pick another one if it is taken. The lane's `lane.name` is `lane1`, so its queue is `jobs:lane1`. Jobs enqueued at https://queue-workers1.localhost go to lane 1's workers only, and Redis holds both lanes' keys:

  ```sh
  docker compose -p queue-workers exec -T redis redis-cli --scan --pattern 'jobs:*'
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
  error: lane queue-workers@0 runs keep_awake services (worker.1, worker.2), so it stays awake
  hint: set services.worker.1.keep_awake and services.worker.2.keep_awake to false in the project config to let it freeze
  ```

  The key to change is `services.worker.keep_awake`; the hint names each replica. Without `keep_awake`, a lane whose only traffic is jobs would freeze after `lanes.freeze_after` and its workers would stop taking jobs.

- Enqueue 10 jobs, then stop the workers while they work. `devlanes stop worker` answers `worker not found`, because each replica is its own unit; select them by tag with `devlanes stop +worker`:

  ```text
  stopped queue-workers@0:worker.1 exit=1
  stopped queue-workers@0:worker.2 exit=1
  ```

  `devlanes logs worker.1 worker.2 --tail 8` ends with each worker finishing its job before it exits:

  ```text
  worker.1#19 worker.1 got SIGINT, finishing job 14 first
  worker.2#19 worker.2 got SIGINT, finishing job 13 first
  worker.1#20 Terminate batch job (Y/N)?
  worker.2#20 Terminate batch job (Y/N)?
  worker.1#21 worker.1 finished job 14 in 2001 ms
  worker.2#21 worker.2 finished job 13 in 2001 ms
  worker.1#22 worker.1 stopped cleanly, jobs:main keeps the waiting jobs for the next start
  worker.2#22 worker.2 stopped cleanly, jobs:main keeps the waiting jobs for the next start
  ```

  That log is from Windows, which has no POSIX signals: devlanes sends `SIGINT` as Ctrl-C, and as Ctrl-Break for a `run:` string, whose programs ignore Ctrl-C. This example uses `run_script`, so Node gets Ctrl-C and raises its `SIGINT` event as on macOS and Linux. npm's `npm.cmd` runs under `cmd.exe`, which prints `Terminate batch job (Y/N)?` and makes the stop report `exit=1`; the job still finishes. `devlanes start +worker` brings both workers back, and they take the jobs that were left waiting.

- Drop the finished-job records with `devlanes run cleanup`. Cron-like jobs are tasks, since a service that exits shows as failed:

  ```text
  cleanup removed 16 finished jobs from jobs:main:done
  ```

- Clean lane 1 with `devlanes lane clean queue-workers-review --yes`. `infra.teardown.queue` deletes the `jobs:lane1:*` keys and leaves lane 0's queue:

  ```text
  cleaned queue-workers@1: stopped 3 units, teardown queue
  ```

- Clean up everything: `devlanes lane clean 0 --yes` deletes lane 0's keys. Redis outlives every lane, so remove it with `docker compose -p queue-workers down -v`.

## Files

- `devlanes.yaml`: the queue prefix in `lanes.vars`, the teardown entry, `REDIS_URL` and `QUEUE_PREFIX` in `global_env`, the `install` and `cleanup` tasks, `api` and the `worker` replicas.
- `docker-compose.yml`: Redis with a pinned tag, an ephemeral loopback port and a healthcheck.
- `api.mjs`: the page, `/api/jobs` (GET and POST), `/lane` and `/healthz`.
- `worker.mjs`: takes jobs with `BLMOVE`, reports its state, prints the ready line and finishes its job on `SIGINT`.
- `queue.mjs`: the Redis key names under `QUEUE_PREFIX`, shared by the three scripts.
- `cleanup.mjs`: the `cleanup` task.
- `package.json` and `package-lock.json`: the pinned `redis` client.
- `devlanes.css` and `logo.svg`: the page's look, copied from `_template`.

## Docs

- [Workers and consumers](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#workers-and-consumers)
- [Replicas](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/services.md#replicas)
- [Keeping a lane awake](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#keeping-a-lane-awake)
- [Lifecycle tasks](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/lifecycle.md#lifecycle-tasks)
- [Stopping units on Windows](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/windows.md#stopping-units)
- [Infra setup and teardown](https://github.com/devlanes-run/devlanes/blob/main/docs/guides/infra.md#setup-and-teardown)
