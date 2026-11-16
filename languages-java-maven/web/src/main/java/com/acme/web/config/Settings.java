package com.acme.web.config;

import com.acme.shared.LaneSettings;
import java.util.Map;

/** Every variable and property the web app reads, read once at startup. */
public record Settings(LaneSettings lane, String quotesUrl, String trustStore) {
  /** Reads the settings, failing with the name of the first missing variable. */
  public static Settings load() {
    Map<String, String> env = System.getenv();
    return new Settings(
      LaneSettings.from(env),
      LaneSettings.required(env, "QUOTES_URL"),
      // Shown on the page; the JDK reads it itself. devlanes sets it through JAVA_TOOL_OPTIONS.
      System.getProperty("javax.net.ssl.trustStore")
    );
  }
}
