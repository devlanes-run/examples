import type { ReactNode } from "react";
import type { LaneProps } from "./LaneCard.js";

const EXAMPLE = "workflows-pnpm-monorepo";

type PageProps = {
  /** The logo URL; each app imports it from its own `brand` link. */
  logo: string;
  lane: LaneProps;
  lede: ReactNode;
  children: ReactNode;
};

/** The devlanes page shell shared by the Vite apps: header, lane title, content and footer. */
export function Page({ logo, lane, lede, children }: PageProps) {
  return (
    <div className="dl-page">
      <header className="dl-header">
        <a className="dl-brand" href="https://devlanes.run">
          <img src={logo} alt="" width="32" height="32" />
          devlanes
        </a>
        <nav className="dl-nav">
          <a href={`https://github.com/devlanes-run/examples/tree/main/${EXAMPLE}`}>
            {EXAMPLE} on GitHub
          </a>
        </nav>
      </header>
      <main className="dl-main">
        <h1 className="dl-title">
          This is lane {lane.lane} of {lane.project}.
        </h1>
        <p className="dl-lede">{lede}</p>
        {children}
      </main>
      <footer className="dl-footer">devlanes examples: {EXAMPLE}, rendered by @acme/ui</footer>
    </div>
  );
}
