package com.acme.shared.quotes;

/** One quote as the quotes API returns it. */
public record Quote(int id, String text, String author) {}
