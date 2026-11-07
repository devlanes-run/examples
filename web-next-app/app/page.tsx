import type { Metadata } from "next";
import { headers } from "next/headers";
import { laneInfo } from "@/lib/lane";

type ApiAnswer = { lane: number; lane_name: string; url: string | null; items: unknown[] };

type Probe = {
  variable: string;
  target: string | undefined;
  ms: number;
  status?: number;
  answer?: ApiAnswer;
  error?: string;
};

async function probe(variable: string): Promise<Probe> {
  const target = process.env[variable];
  const started = performance.now();
  try {
    const res = await fetch(`${target}/`, { cache: "no-store" });
    const ms = performance.now() - started;
    if (!res.ok)
      return {
        variable,
        target,
        ms,
        status: res.status,
        error: `HTTP ${res.status} ${res.statusText}`,
      };
    return { variable, target, ms, status: res.status, answer: (await res.json()) as ApiAnswer };
  } catch (err) {
    // fetch reports "fetch failed" and puts the TLS or connection error in cause.
    const cause = err instanceof Error && err.cause instanceof Error ? err.cause : err;
    return { variable, target, ms: performance.now() - started, error: String(cause) };
  }
}

export function generateMetadata(): Metadata {
  return { title: `Lane ${process.env.DEVLANES_LANE} of ${process.env.DEVLANES_LANE_PROJECT}` };
}

function ProbeCard({ probe, note }: { probe: Probe; note: string }) {
  const ok = probe.answer !== undefined;
  return (
    <div className="dl-card">
      <div className="dl-bar">
        <span className="dl-dots">
          <i></i>
          <i></i>
          <i></i>
        </span>
        <span>fetch(process.env.{probe.variable})</span>
        <span></span>
      </div>
      <dl className="dl-rows">
        <dt>target</dt>
        <dd className="dl-url">{probe.target}</dd>
        <dt>result</dt>
        <dd className={ok ? "dl-ok" : "dl-bad"}>
          {probe.answer ? `${probe.status} with ${probe.answer.items.length} items` : probe.error}
        </dd>
        <dt>time</dt>
        <dd>{probe.ms.toFixed(1)} ms</dd>
        {probe.answer && (
          <>
            <dt>api lane</dt>
            <dd>
              {probe.answer.lane} <span className="dl-key">{probe.answer.lane_name}</span>
            </dd>
            <dt>api saw</dt>
            <dd>
              {probe.answer.url
                ? `X-Forwarded-Host, so ${probe.answer.url}`
                : "no X-Forwarded-Host, a direct call"}
            </dd>
          </>
        )}
        <dt>why</dt>
        <dd>{note}</dd>
      </dl>
    </div>
  );
}

export default async function Home() {
  const info = laneInfo((await headers()).get("x-forwarded-host"));
  // One after the other, so each timing covers a single request.
  const viaProxy = await probe("API_PUBLIC_URL");
  const direct = await probe("API_URL");
  const folder = "https://github.com/devlanes-run/examples/tree/main/web-next-app";

  return (
    <div className="dl-page">
      <header className="dl-header">
        <a className="dl-brand" href="https://devlanes.run">
          <img src="/logo.svg" alt="" width={32} height={32} />
          devlanes
        </a>
        <nav className="dl-nav">
          <a href={folder}>web-next-app on GitHub</a>
        </nav>
      </header>
      <main className="dl-main">
        <h1 className="dl-title">
          This is lane {info.lane} of {info.project}.
        </h1>
        <p className="dl-lede">
          The <code>{info.service}</code> service, a Next.js server component, answered from the
          worktree on <code>{info.branch}</code>.
        </p>
        <div className="dl-card">
          <div className="dl-bar">
            <span className="dl-dots">
              <i></i>
              <i></i>
              <i></i>
            </span>
            <span>
              {info.project}@{info.lane}:{info.service}
            </span>
            <span></span>
          </div>
          <dl className="dl-rows">
            <dt>lane</dt>
            <dd>
              {info.lane} <span className="dl-key">{info.lane_name}</span>
            </dd>
            <dt>branch</dt>
            <dd>{info.branch}</dd>
            <dt>service</dt>
            <dd>{info.service}</dd>
            <dt>port</dt>
            <dd>{info.port}</dd>
            <dt>url</dt>
            <dd>
              {info.url ? (
                <a href={info.url}>{info.url}</a>
              ) : (
                <span className="dl-bad">not through the proxy</span>
              )}
            </dd>
          </dl>
        </div>

        <h2 className="dl-h2">The API, fetched twice on the server</h2>
        <p className="dl-lede">
          This page fetched the lane's <a href={viaProxy.target}>api</a> service while it rendered:
          once through the HTTPS proxy and once straight to its port.
        </p>
        <ProbeCard
          probe={viaProxy}
          note="HTTPS through the proxy. Node trusts the devlanes CA because devlanes set NODE_EXTRA_CA_CERTS for this service."
        />
        <ProbeCard
          probe={direct}
          note="Plain HTTP to 127.0.0.1, the server-to-server address. No proxy, no TLS."
        />

        <div className="dl-card">
          <dl className="dl-rows">
            <dt>GET /lane</dt>
            <dd>
              <a href="/lane">the values above as JSON</a>
            </dd>
            <dt>GET /healthz</dt>
            <dd>
              <a href="/healthz">the ready check</a>: <span className="dl-ok">ok</span>
            </dd>
          </dl>
        </div>
      </main>
      <footer className="dl-footer">
        app/page.tsx, a server component; api/server.mjs, node:http
      </footer>
    </div>
  );
}
