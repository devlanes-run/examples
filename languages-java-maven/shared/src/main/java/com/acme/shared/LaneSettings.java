package com.acme.shared;

import java.util.Map;

/** The values devlanes gives every service of the lane. */
public record LaneSettings(
  String project,
  int lane,
  String laneName,
  String service,
  String branch,
  String domain,
  int port
) {
  /** Reads the lane values from {@code env}, failing when the app runs outside devlanes. */
  public static LaneSettings from(Map<String, String> env) {
    return new LaneSettings(
      required(env, "DEVLANES_LANE_PROJECT"),
      Integer.parseInt(required(env, "DEVLANES_LANE")),
      required(env, "DEVLANES_LANE_NAME"),
      required(env, "DEVLANES_SERVICE"),
      // Set in devlanes.yaml from ${{ lane.label }} and ${{ lane.domain }}.
      required(env, "LANE_LABEL"),
      required(env, "LANE_DOMAIN"),
      // preset: spring-boot sets SERVER_PORT, which Spring listens on.
      Integer.parseInt(required(env, "SERVER_PORT"))
    );
  }

  /** The value of {@code name}, or an error that stops the app at startup. */
  public static String required(Map<String, String> env, String name) {
    String value = env.get(name);
    if (value == null || value.isBlank()) {
      throw new IllegalStateException(name + " is not set; start this service with devlanes start");
    }
    return value;
  }
}
