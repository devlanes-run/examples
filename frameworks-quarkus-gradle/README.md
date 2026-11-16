# Quarkus with Gradle and Postgres per lane

A Quarkus app in dev mode, run through the Gradle Wrapper, that keeps notes in its lane's own Postgres container and renders them with Qute. Each lane also gets its own debugger port, so a second lane does not lose debugging to the first.

## Requirements

- devlanes, with `devlanes setup` run once
- JDK 21 or later; the Gradle Wrapper downloads Gradle itself
- Docker with Compose 2.24.4 or newer, which `per_lane` needs

## Run it

```sh
cd frameworks-quarkus-gradle
devlanes start
```

`devlanes start --no-ui` prints the start as text:

```text
✓ infra
✓ setup
✓ services ready
example-quarkus-gradle@0 · main
✓ services  1 of 1 ready
  ✓  web  https://example-quarkus-gradle.localhost
```

Open https://example-quarkus-gradle.localhost. The page shows lane 0 of `example-quarkus-gradle`, the lane's Postgres container with its notes, and the port to attach a debugger to. "Add a note" inserts a row.

## During a start

1. Infra. Postgres starts in the lane's own Compose project, `example-quarkus-gradle-lane<N>`, on a port from the lane's block, with its own `pgdata` volume.
2. `infra.setup.schema` runs once per lane and feeds `infra/schema.sql` to `psql`, which creates the `notes` table and its first row.
3. `web` runs `./gradlew quarkusDev`. devlanes adds `--no-daemon`, so the Gradle build and the app it forks belong to the service and stop with it. The first start downloads Gradle and the dependencies, so the ready check allows 5 minutes.
4. `preset: quarkus` sets `QUARKUS_HTTP_PORT`, `QUARKUS_HTTP_HOST=127.0.0.1` and `QUARKUS_HTTP_TEST_PORT=0`, plus `QUARKUS_HTTP_HOST_VALIDATION_ALLOWED_HOSTS` with the service's hostname, since Quarkus bound to `127.0.0.1` otherwise rejects requests from the proxy. It also passes `-Ddebug=<port>` with a `debug` port of the lane's own. `DEBUG_PORT: ${{ self.ports.debug }}` hands the same number to the page.
5. Quarkus reads `QUARKUS_DATASOURCE_JDBC_URL`, built from `${{ infra.postgres.port }}`. Dev Services is off in `application.properties`, so Quarkus does not start a database of its own.
6. The ready check waits for `/healthz`.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/frameworks-quarkus-gradle && devlanes start`. https://example-quarkus-gradle1.localhost says lane 1, shows `example-quarkus-gradle-lane1-postgres-1` with only the first row, and a debug port different from lane 0's.
- Attach a debugger to the port the page shows: in IntelliJ IDEA a "Remote JVM Debug" configuration on `127.0.0.1` and that port, or from a terminal `jdb -connect com.sun.jdi.SocketAttach:hostname=127.0.0.1,port=<port>`. A breakpoint in `HomeResource.index` stops on the next page load.
- Change the lede in `src/main/resources/templates/HomeResource/index.html` and reload the page. Quarkus dev mode sees the change on that request and reloads the app inside the same process, and `devlanes logs web --tail 20` shows `Restarting quarkus due to changes in index.html.`
- `devlanes lane clean 1 --yes` removes lane 1's Postgres container and its volume; lane 0 keeps its notes.

## Files

- [`devlanes.yaml`](devlanes.yaml): `infra.per_lane`, the schema setup entry and the `web` service with `run_script` on `build.gradle.kts` and `preset: quarkus`.
- [`build.gradle.kts`](build.gradle.kts) and [`gradle.properties`](gradle.properties): the Quarkus extensions and the one place the Quarkus version is written.
- [`src/main/resources/application.properties`](src/main/resources/application.properties): Dev Services off.
- [`src/main/java/com/acme/notes/`](src/main/java/com/acme/notes): `config/Settings.java` reads every variable, `notes/` holds the queries and the API, `pages/` renders the page.
- [`src/main/resources/templates/`](src/main/resources/templates): the Qute layout, the lane card tag and the page.

## Docs

- [Run scripts your project already has](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/run-scripts.md)
- [Run Spring Boot and Quarkus](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/spring-boot-and-quarkus.md)
- [Give each lane its own container](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/infra/container-per-lane.md)
