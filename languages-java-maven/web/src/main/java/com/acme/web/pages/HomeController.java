package com.acme.web.pages;

import com.acme.shared.LaneInfo;
import com.acme.shared.quotes.QuotesClient;
import com.acme.web.config.Settings;
import com.acme.web.lane.PublicUrl;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/** The home page, with the lane card and the call to quotes. */
@Controller
public class HomeController {

  private final Settings settings;
  private final QuotesClient quotes;

  public HomeController(Settings settings, QuotesClient quotes) {
    this.settings = settings;
    this.quotes = quotes;
  }

  /** Renders templates/index.html. */
  @GetMapping("/")
  public String index(HttpServletRequest request, Model model) {
    model.addAttribute("info", LaneInfo.of(settings.lane(), PublicUrl.of(request)));
    model.addAttribute("quotesUrl", settings.quotesUrl());
    model.addAttribute("trustStore", settings.trustStore());
    model.addAttribute("quotes", quotes.fetchIndex());
    return "index";
  }
}
