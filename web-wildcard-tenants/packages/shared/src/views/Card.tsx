import type { Child } from "hono/jsx";

/** A titled card whose children are `<dt>`/`<dd>` rows. */
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
      <dl class="dl-rows">{children}</dl>
    </div>
  );
}
