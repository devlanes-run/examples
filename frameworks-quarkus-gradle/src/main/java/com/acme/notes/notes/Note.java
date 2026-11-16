package com.acme.notes.notes;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.OffsetDateTime;

/** One row of the notes table. */
public record Note(int id, String body, @JsonProperty("created_at") OffsetDateTime createdAt) {}
