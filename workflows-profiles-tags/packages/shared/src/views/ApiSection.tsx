import type { Child } from "hono/jsx";

/** The heading over a page's API cards, saying where their URLs and data files come from. */
export function ApiSection({ children }: { children: Child }) {
  return (
    <>
      <h2 class="dl-h2">APIs this page calls</h2>
      <p class="dl-lede">
        The URLs come from this service's environment: the <code>web</code> template sets this
        lane's APIs, and the <code>attach</code> profile replaces them with lane 0's. Each API
        reports the data file it reads, which the <code>test</code> profile moves.
      </p>
      {children}
    </>
  );
}
