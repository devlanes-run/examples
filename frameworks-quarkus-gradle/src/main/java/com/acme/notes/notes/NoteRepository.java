package com.acme.notes.notes;

import io.agroal.api.AgroalDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** The queries on the lane's notes table, created by infra/schema.sql. */
@ApplicationScoped
public class NoteRepository {

  private final AgroalDataSource dataSource;

  public NoteRepository(AgroalDataSource dataSource) {
    this.dataSource = dataSource;
  }

  /** The newest notes, at most {@code limit}. */
  public List<Note> latest(int limit) throws SQLException {
    String sql = "SELECT id, body, created_at FROM notes ORDER BY id DESC LIMIT ?";
    try (
      Connection connection = dataSource.getConnection();
      PreparedStatement statement = connection.prepareStatement(sql)
    ) {
      statement.setInt(1, limit);
      try (ResultSet rows = statement.executeQuery()) {
        List<Note> notes = new ArrayList<>();
        while (rows.next()) {
          notes.add(
            new Note(
              rows.getInt("id"),
              rows.getString("body"),
              rows.getObject("created_at", OffsetDateTime.class)
            )
          );
        }
        return notes;
      }
    }
  }

  /** How many notes the table has. */
  public long count() throws SQLException {
    return scalar("SELECT count(*) FROM notes").map(Long::parseLong).orElse(0L);
  }

  /** The Postgres server version, such as 17.11. */
  public String serverVersion() throws SQLException {
    return scalar("SHOW server_version").orElse("unknown");
  }

  /** Inserts a note. */
  public void add(String body) throws SQLException {
    try (
      Connection connection = dataSource.getConnection();
      PreparedStatement statement = connection.prepareStatement(
        "INSERT INTO notes (body) VALUES (?)"
      )
    ) {
      statement.setString(1, body);
      statement.executeUpdate();
    }
  }

  private Optional<String> scalar(String sql) throws SQLException {
    try (
      Connection connection = dataSource.getConnection();
      PreparedStatement statement = connection.prepareStatement(sql);
      ResultSet rows = statement.executeQuery()
    ) {
      return rows.next() ? Optional.ofNullable(rows.getString(1)) : Optional.empty();
    }
  }
}
