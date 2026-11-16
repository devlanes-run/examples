package com.acme.quotes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The settings the controllers use. */
@Configuration(proxyBeanMethods = false)
public class QuotesConfig {

  /** Created at startup, so a missing variable stops the app before it listens. */
  @Bean
  public Settings settings() {
    return Settings.load();
  }
}
