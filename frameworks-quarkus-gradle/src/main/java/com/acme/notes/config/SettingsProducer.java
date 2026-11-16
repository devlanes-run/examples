package com.acme.notes.config;

import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Singleton;

/** Makes {@link Settings} injectable. */
@ApplicationScoped
public class SettingsProducer {

  /** Created at startup, so a missing variable stops the app before it serves requests. */
  @Produces
  @Singleton
  @Startup
  Settings settings() {
    return Settings.load();
  }
}
