package com.acme.notes.lane;

import com.acme.notes.config.Settings;
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
  /** The lane values, with the URL from the proxy's X-Forwarded-Host header, if any. */
  public static LaneInfo of(Settings settings, String forwardedHost) {
    // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
    String url = forwardedHost == null ? null : "https://" + forwardedHost;
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
