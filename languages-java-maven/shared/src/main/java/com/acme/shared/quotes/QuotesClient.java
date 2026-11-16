package com.acme.shared.quotes;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/** A typed client for the quotes API. */
public final class QuotesClient {

  private static final Duration TIMEOUT = Duration.ofSeconds(5);

  private final RestClient client;

  private QuotesClient(RestClient client) {
    this.client = client;
  }

  /** A client for the quotes service at {@code baseUrl}, with connect and read timeouts. */
  public static QuotesClient create(String baseUrl) {
    // The JDK client verifies certificates against the default trust store, which devlanes
    // points at its own through JAVA_TOOL_OPTIONS.
    HttpClient http = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();
    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
    factory.setReadTimeout(TIMEOUT);
    return new QuotesClient(RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build());
  }

  /** Requests the quotes index; failures come back as a {@link QuotesCall} for the page. */
  public QuotesCall fetchIndex() {
    try {
      ResponseEntity<QuotesIndex> response = client
        .get()
        .uri("/")
        .retrieve()
        .toEntity(QuotesIndex.class);
      return QuotesCall.ok(response.getStatusCode().value(), response.getBody());
    } catch (RestClientResponseException error) {
      // Its message repeats the whole body, such as the proxy's error page; the status is enough.
      return QuotesCall.failed(error, error.getStatusCode().value() + " " + error.getStatusText());
    } catch (RestClientException error) {
      return QuotesCall.failed(error, error.getMessage());
    }
  }
}
