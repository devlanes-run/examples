package com.acme.web.lane;

import com.acme.shared.LaneInfo;
import com.acme.web.config.Settings;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** The ready check and the lane JSON. */
@RestController
public class LaneController {

  private final Settings settings;

  public LaneController(Settings settings) {
    this.settings = settings;
  }

  /** What devlanes' ready check requests. */
  @GetMapping(path = "/healthz", produces = MediaType.TEXT_PLAIN_VALUE)
  public String healthz() {
    return "ok";
  }

  /** The lane values for this request. */
  @GetMapping("/lane")
  public LaneInfo lane(HttpServletRequest request) {
    return LaneInfo.of(settings.lane(), PublicUrl.of(request));
  }
}
