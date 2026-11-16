# Java with Maven and Spring Boot

Two Spring Boot apps in one Maven multi-module build, run through the Maven Wrapper. `web` renders a Thymeleaf page and calls `quotes` over HTTPS with Spring's `RestClient`, which trusts the devlanes CA through the trust store devlanes gives every JVM.

## Requirements

- devlanes, with `devlanes setup` run once
- JDK 21 or later; the Maven Wrapper downloads Maven itself

## Run it

```sh
cd languages-java-maven
devlanes start
```

`devlanes start --no-ui` prints the start as text:

```text
✓ services ready
example-java-maven@0 · main
✓ services  2 of 2 ready
  ✓  web     https://example-java-maven.localhost
  ✓  quotes  https://quotes.example-java-maven.localhost
```

Open https://example-java-maven.localhost. The page shows lane 0 of `example-java-maven`, the trust store the JVM uses and the answer of the lane's `quotes` service.

## During a start

1. The first start downloads Maven into `~/.m2/wrapper` and the dependencies into `~/.m2/repository`, so both ready checks allow 5 minutes.
2. `web` runs `./mvnw -pl web -am spring-boot:run` from the root `pom.xml`. `-am` compiles the `shared` module first, and the parent pom skips `spring-boot:run` in every module except the two apps.
3. `quotes` runs `./mvnw -pl quotes spring-boot:run`, without `-am`: Maven has no build lock, so only one service builds `shared`, and `quotes` does not depend on it.
4. `preset: spring-boot` gives each app `SERVER_PORT`, `SERVER_ADDRESS=127.0.0.1` and `SERVER_FORWARD_HEADERS_STRATEGY=framework`. `quotes` names a `management` port in its `hosts`, so it also gets `MANAGEMENT_SERVER_PORT` and serves the actuator on a port of its own.
5. Each service counts as ready once `/healthz` answers.

devlanes detects the `java` platform from `pom.xml` and adds `-Djavax.net.ssl.trustStore=...` to `JAVA_TOOL_OPTIONS`, pointing at a trust store with the system roots and the devlanes CA. Maven and the app JVM it forks both pick it up, which is why their logs start with `Picked up JAVA_TOOL_OPTIONS`. `web` gets `QUOTES_URL` from `${{ services.quotes.public_url }}`, so its call goes through the proxy over HTTPS.

## Try next

- Start a second lane: `git worktree add ../examples-checkout -b feat/checkout`, then `cd ../examples-checkout/languages-java-maven && devlanes start`. https://example-java-maven1.localhost says lane 1, and its `quotes` answer comes from lane 1 too.
- The actuator answers on its own hostname. This prints `{"groups":["liveness","readiness"],"status":"UP"}`, while the same path on `quotes.example-java-maven.localhost` is a 404 (on Windows add `--ssl-revoke-best-effort`):

  ```sh
  curl -fsS https://actuator.quotes.example-java-maven.localhost/actuator/health
  ```

- `devlanes env show web --explain` lists `JAVA_TOOL_OPTIONS` in the `contributor` layer, and `SERVER_PORT` and the other Spring variables from the preset.
- Change a quote in `quotes/src/main/java/com/acme/quotes/api/Quote.java` and run `devlanes restart quotes`. `spring-boot:run` compiles the change, and a reload of the page shows it.
- `devlanes stop quotes` and reload the page: the quotes card shows the 503 the proxy answers while `quotes` is stopped. `devlanes start quotes` brings it back.

## Files

- [`devlanes.yaml`](devlanes.yaml): both services with `run_script` on `pom.xml`, `preset: spring-boot`, `hosts` and the `management` port.
- [`pom.xml`](pom.xml): the parent with the Spring Boot version and the `skip` setting for `spring-boot:run`.
- [`shared/`](shared): the lane values and the typed quotes client in `QuotesClient.java`.
- [`web/src/main/java/com/acme/web/`](web/src/main/java/com/acme/web): `config/Settings.java` reads every variable, and `pages/` renders the [templates](web/src/main/resources/templates).
- [`quotes/`](quotes): the API and its `application.properties`.

## Docs

- [Run scripts your project already has](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/run-scripts.md)
- [Run Spring Boot and Quarkus](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/projects/spring-boot-and-quarkus.md)
- [Trust the devlanes CA](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/hostnames/trust-the-ca.md)
- [Give a service several ports and hostnames](https://github.com/devlanes-run/devlanes/blob/main/docs/how-to/services/ports-and-hostnames.md)
