package com.acme.notes.config;

import java.util.Map;

/** Every variable the app reads, read once at startup. */
public record Settings(
  String project,
  int lane,
  String laneName,
  String service,
  String branch,
  int port,
  int debugPort,
  String jdbcUrl,
  String postgresContainer
) {
  /** Reads the settings, failing with the name of the first missing variable. */
  public static Settings load() {
    Map<String, String> env = System.getenv();
    return new Settings(
      required(env, "DEVLANES_LANE_PROJECT"),
      Integer.parseInt(required(env, "DEVLANES_LANE")),
      required(env, "DEVLANES_LANE_NAME"),
      required(env, "DEVLANES_SERVICE"),
      // Set in devlanes.yaml from ${{ lane.label }}.
      required(env, "LANE_LABEL"),
      // preset: quarkus sets QUARKUS_HTTP_PORT, which Quarkus listens on.
      Integer.parseInt(required(env, "QUARKUS_HTTP_PORT")),
      // The port preset: quarkus passes to quarkusDev as -Ddebug, from ${{ self.ports.debug }}.
      Integer.parseInt(required(env, "DEBUG_PORT")),
      // Quarkus reads it itself; the page shows it.
      required(env, "QUARKUS_DATASOURCE_JDBC_URL"),
      required(env, "POSTGRES_CONTAINER")
    );
  }

  private static String required(Map<String, String> env, String name) {
    String value = env.get(name);
    if (value == null || value.isBlank()) {
      throw new IllegalStateException(name + " is not set; start this service with devlanes start");
    }
    return value;
  }
}
