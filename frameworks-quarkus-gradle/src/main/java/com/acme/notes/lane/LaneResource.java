package com.acme.notes.lane;

import com.acme.notes.config.Settings;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/** The ready check and the lane JSON. */
@Path("/")
public class LaneResource {

  private final Settings settings;

  public LaneResource(Settings settings) {
    this.settings = settings;
  }

  /** What devlanes' ready check requests. */
  @GET
  @Path("healthz")
  @Produces(MediaType.TEXT_PLAIN)
  public String healthz() {
    return "ok";
  }

  /** The lane values for this request. */
  @GET
  @Path("lane")
  @Produces(MediaType.APPLICATION_JSON)
  public LaneInfo lane(@HeaderParam("X-Forwarded-Host") String forwardedHost) {
    return LaneInfo.of(settings, forwardedHost);
  }
}
