package com.acme.quotes.api;

import java.util.List;

/** One quote as the API returns it. */
public record Quote(int id, String text, String author) {
  /** The mock quotes the API serves. */
  public static final List<Quote> ALL = List.of(
    new Quote(1, "Ship the smallest change that works.", "acme handbook"),
    new Quote(2, "A branch you can run is a branch you can review.", "acme handbook"),
    new Quote(3, "Read the error before you search for it.", "acme handbook")
  );
}
