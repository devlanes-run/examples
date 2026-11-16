package com.acme.quotes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Starts the quotes API; Spring finds the controllers and the config in the packages below. */
@SpringBootApplication
public class QuotesApplication {

  public static void main(String[] args) {
    SpringApplication.run(QuotesApplication.class, args);
  }
}
