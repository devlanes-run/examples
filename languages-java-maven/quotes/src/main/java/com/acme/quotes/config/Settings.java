package com.acme.quotes.config;

import java.util.Map;

/** Every variable the quotes API reads, read once at startup. */
public record Settings(
  String project,
  int lane,
  String laneName,
  String service,
  String branch,
  int port
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
      // preset: spring-boot sets SERVER_PORT, which Spring listens on.
      Integer.parseInt(required(env, "SERVER_PORT"))
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
