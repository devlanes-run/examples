import type { ReactNode } from "react";

/** A terminal-style card with a title bar. */
export function Card({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="dl-card">
      <div className="dl-bar">
        <span className="dl-dots">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
        <span />
      </div>
      {children}
    </section>
  );
}
