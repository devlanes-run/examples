package com.acme.notes.pages;

import com.acme.notes.config.Settings;
import com.acme.notes.lane.LaneInfo;
import com.acme.notes.notes.Note;
import com.acme.notes.notes.NoteRepository;
import io.quarkus.qute.CheckedTemplate;
import io.quarkus.qute.TemplateInstance;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.sql.SQLException;
import java.util.List;

/** The home page: the lane card, this lane's database and the debug port. */
@Path("/")
public class HomeResource {

  private final Settings settings;
  private final NoteRepository notes;

  public HomeResource(Settings settings, NoteRepository notes) {
    this.settings = settings;
    this.notes = notes;
  }

  /** What the Postgres card shows. */
  public record Database(
    String container,
    String jdbcUrl,
    String version,
    long rows,
    List<Note> latest
  ) {}

  /** Type-checked templates under templates/HomeResource/. */
  @CheckedTemplate
  static class Templates {

    static native TemplateInstance index(LaneInfo info, Database database, int debugPort);
  }

  /** Renders the page. */
  @GET
  @Produces(MediaType.TEXT_HTML)
  public TemplateInstance index(
    @HeaderParam("X-Forwarded-Host") String forwardedHost
  ) throws SQLException {
    Database database = new Database(
      settings.postgresContainer(),
      settings.jdbcUrl(),
      notes.serverVersion(),
      notes.count(),
      notes.latest(10)
    );
    return Templates.index(LaneInfo.of(settings, forwardedHost), database, settings.debugPort());
  }
}
