package com.acme.notes.notes;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.sql.SQLException;
import java.util.List;

/** The notes API and the form handler behind the page's button. */
@Path("/")
public class NotesResource {

  private final NoteRepository notes;

  public NotesResource(NoteRepository notes) {
    this.notes = notes;
  }

  /** The newest notes as JSON. */
  @GET
  @Path("api/notes")
  @Produces(MediaType.APPLICATION_JSON)
  public List<Note> list() throws SQLException {
    return notes.latest(20);
  }

  /** Adds a note from the page's form and sends the browser back to the page. */
  @POST
  @Path("notes")
  @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
  public Response add(@FormParam("body") String body) throws SQLException {
    if (body != null && !body.isBlank()) {
      notes.add(body.strip());
    }
    // A relative Location: Response.seeOther would make it absolute with the http:// address
    // Quarkus listens on, sending the browser around the proxy.
    return Response.status(Response.Status.SEE_OTHER).header(HttpHeaders.LOCATION, "/").build();
  }
}
