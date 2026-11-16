package com.acme.shared.quotes;

/** The status and body quotes answered with, or the error the call failed with. */
public record QuotesCall(Integer status, QuotesIndex body, String error) {
  /** A call that got an answer. */
  public static QuotesCall ok(int status, QuotesIndex body) {
    return new QuotesCall(status, body, null);
  }

  /** A call that failed, with the exception's type and {@code message} for the page. */
  public static QuotesCall failed(Exception error, String message) {
    return new QuotesCall(null, null, error.getClass().getSimpleName() + ": " + message);
  }
}
