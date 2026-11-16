package com.acme.quotes.lane;

import com.acme.quotes.config.Settings;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

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
  /** The lane values for {@code request}, with the URL the proxy received it on. */
  public static LaneInfo of(Settings settings, HttpServletRequest request) {
    return new LaneInfo(
      settings.project(),
      settings.lane(),
      settings.laneName(),
      settings.branch(),
      settings.service(),
      settings.port(),
      publicUrl(request)
    );
  }

  private static String publicUrl(HttpServletRequest request) {
    // SERVER_FORWARD_HEADERS_STRATEGY=framework applies X-Forwarded-Proto and X-Forwarded-Host
    // to the request and then hides those headers, so only a proxied request is secure here.
    if (!request.isSecure()) {
      return null;
    }
    return ServletUriComponentsBuilder.fromContextPath(request).build().toUriString();
  }
}
