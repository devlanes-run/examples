import type { Child } from "hono/jsx";

/** A terminal-style card with `title` in its bar. */
export function Card({ title, children }: { title: string; children: Child }) {
  return (
    <div class="dl-card">
      <div class="dl-bar">
        <span class="dl-dots">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
        <span />
      </div>
      {children}
    </div>
  );
}
