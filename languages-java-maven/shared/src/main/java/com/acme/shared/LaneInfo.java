package com.acme.shared;

import com.fasterxml.jackson.annotation.JsonProperty;

/** The JSON every devlanes example answers on /lane. */
public record LaneInfo(
  String project,
  int lane,
  @JsonProperty("lane_name") String laneName,
  String branch,
  String service,
  int port,
  String url
) {
  /** The lane values with the URL the proxy received the request on, or null without one. */
  public static LaneInfo of(LaneSettings settings, String url) {
    return new LaneInfo(
      settings.project(),
      settings.lane(),
      settings.laneName(),
      settings.branch(),
      settings.service(),
      settings.port(),
      url
    );
  }
}
