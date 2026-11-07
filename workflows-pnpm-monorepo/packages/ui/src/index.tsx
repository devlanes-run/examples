import type { CSSProperties, ReactNode } from "react";

const repo = "https://github.com/devlanes-run/examples/tree/main/workflows-pnpm-monorepo";

export interface LaneProps {
  project: string;
  lane: number;
  laneName: string;
  branch: string;
  service: string;
  port: number;
}

function laneColor(lane: number): CSSProperties {
  return { ["--dl-lane" as string]: `var(--dl-lane-${lane % 4})` };
}

export function Page({
  logo,
  lane,
  lede,
  children,
}: {
  logo: string;
  lane: LaneProps;
  lede: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="dl-page">
      <header className="dl-header">
        <a className="dl-brand" href="/">
          <img src={logo} alt="" width="32" height="32" />
          devlanes
        </a>
        <nav className="dl-nav">
          <a href={repo}>workflows-pnpm-monorepo on GitHub</a>
        </nav>
      </header>
      <main className="dl-main">
        <h1 className="dl-title">
          This is lane {lane.lane} of <span style={{ whiteSpace: "nowrap" }}>{lane.project}.</span>
        </h1>
        <p className="dl-lede">{lede}</p>
        {children}
      </main>
      <footer className="dl-footer">
        devlanes examples: workflows-pnpm-monorepo, rendered by @acme/ui
      </footer>
    </div>
  );
}

export function Card({
  title,
  lane,
  children,
}: {
  title: string;
  lane: number;
  children: ReactNode;
}) {
  return (
    <section className="dl-card" style={laneColor(lane)}>
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

export function LaneCard({ lane }: { lane: LaneProps }) {
  return (
    <Card title="lane" lane={lane.lane}>
      <dl className="dl-rows">
        <dt>lane</dt>
        <dd>
          {lane.lane} ({lane.laneName})
        </dd>
        <dt>branch</dt>
        <dd>{lane.branch}</dd>
        <dt>service</dt>
        <dd>{lane.service}</dd>
        <dt>port</dt>
        <dd>{lane.port}</dd>
        <dt>url</dt>
        <dd className="dl-url">{window.location.origin}</dd>
      </dl>
    </Card>
  );
}
