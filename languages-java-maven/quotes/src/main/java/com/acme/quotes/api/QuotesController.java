package com.acme.quotes.api;

import com.acme.quotes.config.Settings;
import com.acme.quotes.lane.LaneInfo;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** The quotes list and the API's index. */
@RestController
public class QuotesController {

  private final Settings settings;

  public QuotesController(Settings settings) {
    this.settings = settings;
  }

  /** The answer on /: the lane values plus every quote. */
  public record Index(@JsonUnwrapped LaneInfo lane, List<Quote> quotes) {}

  /** The lane values and the quotes. */
  @GetMapping("/")
  public Index index(HttpServletRequest request) {
    return new Index(LaneInfo.of(settings, request), Quote.ALL);
  }

  /** Every quote. */
  @GetMapping("/api/quotes")
  public List<Quote> quotes() {
    return Quote.ALL;
  }
}
