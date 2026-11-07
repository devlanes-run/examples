import { useEffect, useState } from "react";

const repo = "https://github.com/devlanes-run/examples/tree/main/frameworks-cloudflare-vite";
const inspectUrl = `https://inspect.${window.location.host}/json`;

async function getJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function useJson(url) {
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    getJson(url).then(
      (data) => setState({ status: "ok", data }),
      (error) => setState({ status: "error", error: error.message }),
    );
  }, [url]);
  return state;
}

function Card({ title, lane, children }) {
  const color = Number.isInteger(lane) ? `var(--dl-lane-${lane % 4})` : undefined;
  return (
    <section className="dl-card" style={{ "--dl-lane": color }}>
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

function Counter({ lane }) {
  const [count, setCount] = useState(null);
  const [error, setError] = useState(null);

  async function load(init) {
    try {
      setCount((await getJson("/api/counter", init)).count);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Card title="KV binding COUNTER" lane={lane.lane}>
        <dl className="dl-rows">
          <dt>count</dt>
          {error ? (
            <dd className="dl-bad">{error}</dd>
          ) : (
            <dd className="dl-ok">{count ?? "..."}</dd>
          )}
          <dt>persisted to</dt>
          <dd>{lane.state_path}</dd>
        </dl>
      </Card>
      <p>
        <button className="dl-button" type="button" onClick={() => load({ method: "POST" })}>
          Count one more
        </button>
      </p>
    </>
  );
}

export default function App() {
  const lane = useJson("/api/lane");
  const items = useJson("/api/items");
  const info = lane.status === "ok" ? lane.data : null;

  return (
    <div className="dl-page">
      <header className="dl-header">
        <a className="dl-brand" href="/">
          <img src="/logo.svg" alt="" width="32" height="32" />
          devlanes
        </a>
        <nav className="dl-nav">
          <a href={repo}>frameworks-cloudflare-vite on GitHub</a>
        </nav>
      </header>

      <main className="dl-main">
        {lane.status === "error" && (
          <h1 className="dl-title">The Worker did not answer /api/lane: {lane.error}</h1>
        )}
        {lane.status === "loading" && <h1 className="dl-title">Asking the Worker...</h1>}
        {info && (
          <>
            <h1 className="dl-title">
              This is lane {info.lane} of{" "}
              <span style={{ whiteSpace: "nowrap" }}>{info.project}.</span>
            </h1>
            <p className="dl-lede">
              Served by <code>{info.service}</code> from the <code>{info.branch}</code> worktree.
              Vite serves this page, and a Worker running in workerd inside the same Vite answers{" "}
              <code>/api/*</code>.
            </p>

            <Card title="GET /api/lane" lane={info.lane}>
              <dl className="dl-rows">
                <dt>lane</dt>
                <dd>
                  {info.lane} ({info.lane_name})
                </dd>
                <dt>branch</dt>
                <dd>{info.branch}</dd>
                <dt>service</dt>
                <dd>{info.service}</dd>
                <dt>port</dt>
                <dd>{info.port}</dd>
                <dt>url</dt>
                <dd className="dl-url">{info.url}</dd>
              </dl>
            </Card>

            <h2 className="dl-h2">Items from the Worker</h2>
            <Card title="GET /api/items" lane={info.lane}>
              <dl className="dl-rows">
                {items.status === "loading" && (
                  <>
                    <dt>result</dt>
                    <dd>...</dd>
                  </>
                )}
                {items.status === "error" && (
                  <>
                    <dt>result</dt>
                    <dd className="dl-bad">{items.error}</dd>
                  </>
                )}
                {items.status === "ok" &&
                  items.data.items.map((item) => [
                    <dt key={`k${item.id}`} className="dl-key">
                      {item.sku}
                    </dt>,
                    <dd key={`v${item.id}`}>
                      {item.name}, ${(item.price_cents / 100).toFixed(2)}
                    </dd>,
                  ])}
              </dl>
            </Card>

            <h2 className="dl-h2">A counter per lane</h2>
            <Counter lane={info} />

            <h2 className="dl-h2">The Worker's inspector</h2>
            <Card title="inspectorPort" lane={info.lane}>
              <dl className="dl-rows">
                <dt>port</dt>
                <dd>{info.inspector_port}</dd>
                <dt>targets</dt>
                <dd>
                  <a href={inspectUrl}>{inspectUrl}</a>
                </dd>
              </dl>
            </Card>
          </>
        )}
      </main>

      <footer className="dl-footer">devlanes examples: frameworks-cloudflare-vite</footer>
    </div>
  );
}
