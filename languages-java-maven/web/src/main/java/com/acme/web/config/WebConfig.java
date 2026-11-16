package com.acme.web.config;

import com.acme.shared.quotes.QuotesClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The settings and the quotes client the controllers use. */
@Configuration(proxyBeanMethods = false)
public class WebConfig {

  /** Created at startup, so a missing variable stops the app before it listens. */
  @Bean
  public Settings settings() {
    return Settings.load();
  }

  /** The client for the lane's quotes service. */
  @Bean
  public QuotesClient quotesClient(Settings settings) {
    return QuotesClient.create(settings.quotesUrl());
  }
}
