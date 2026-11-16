package com.acme.shared.quotes;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/** The part of the quotes API's answer on / that the page shows. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record QuotesIndex(int lane, String service, int port, List<Quote> quotes) {}
