package com.acme.web.lane;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/** The URL a request reached the devlanes proxy on. */
public final class PublicUrl {

  private PublicUrl() {}

  /** The https URL of the request, or null when it did not come through the proxy. */
  public static String of(HttpServletRequest request) {
    // SERVER_FORWARD_HEADERS_STRATEGY=framework applies X-Forwarded-Proto and X-Forwarded-Host
    // to the request and then hides those headers, so only a proxied request is secure here.
    if (!request.isSecure()) {
      return null;
    }
    return ServletUriComponentsBuilder.fromContextPath(request).build().toUriString();
  }
}
