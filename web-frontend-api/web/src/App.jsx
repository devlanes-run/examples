import { useCallback, useEffect, useState } from "react";

const env = import.meta.env;
const lane = Number(env.VITE_LANE);
// ?api=<url> points the page at another lane's API, to watch CORS refuse it.
const apiUrl = new URLSearchParams(window.location.search).get("api") ?? env.VITE_API_URL;
const repo = "https://github.com/devlanes-run/examples/tree/main/web-frontend-api";

async function getJson(url, init) {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function useRequest(run) {
  const [state, setState] = useState({ status: "loading" });
  const reload = useCallback(() => {
    run().then(
      (data) => setState({ status: "ok", data }),
      (error) => setState({ status: "error", error: error.message }),
    );
  }, [run]);
  useEffect(reload, [reload]);
  return [state, reload];
}

function Card({ title, children }) {
  return (
    <section className="dl-card" style={{ "--dl-lane": `var(--dl-lane-${lane % 4})` }}>
      <div className="dl-bar">
        <span className="dl-dots"><i /><i /><i /></span>
        <span>{title}</span>
        <span />
      </div>
      {children}
    </section>
  );
}

function Outcome({ state, ok }) {
  if (state.status === "loading") return <dd>...</dd>;
  if (state.status === "error") {
    return <dd className="dl-bad">{state.error} (blocked by CORS? see the browser console)</dd>;
  }
  return <dd className="dl-ok">{ok(state.data)}</dd>;
}

const loadItems = () => getJson(`${apiUrl}/api/items`);
const loadProxied = () => getJson("/proxied/lane");
const loadMe = () => getJson(`${apiUrl}/api/me`);

export default function App() {
  const [items] = useRequest(loadItems);
  const [proxied] = useRequest(loadProxied);
  const [me, reloadMe] = useRequest(loadMe);
  const [cookie, setCookie] = useState(document.cookie);
  const [action, setAction] = useState(null);

  async function session(method) {
    try {
      await getJson(`${apiUrl}/api/session`, { method });
      setAction({ ok: true, text: `${method} /api/session answered` });
    } catch (error) {
      setAction({ ok: false, text: `${method} /api/session failed: ${error.message}` });
    }
    setCookie(document.cookie);
    reloadMe();
  }

  return (
    <div className="dl-page">
      <header className="dl-header">
        <a className="dl-brand" href="/">
          <img src="/logo.svg" alt="" width="32" height="32" />
          devlanes
        </a>
        <nav className="dl-nav">
          <a href={repo}>web-frontend-api on GitHub</a>
        </nav>
      </header>

      <main className="dl-main">
        <h1 className="dl-title">
          This is lane {lane} of <span style={{ whiteSpace: "nowrap" }}>{env.VITE_PROJECT}.</span>
        </h1>
        <p className="dl-lede">
          Served by <code>{env.VITE_SERVICE}</code> from the <code>{env.VITE_LANE_LABEL}</code> worktree.
          The browser calls <code>api</code> at {apiUrl} with CORS, and through <code>/proxied</code> on
          this host without it.
        </p>

        <Card title="lane">
          <dl className="dl-rows">
            <dt>lane</dt>
            <dd>{lane} ({env.VITE_LANE_NAME})</dd>
            <dt>branch</dt>
            <dd>{env.VITE_LANE_LABEL}</dd>
            <dt>service</dt>
            <dd>{env.VITE_SERVICE}</dd>
            <dt>port</dt>
            <dd>{env.VITE_PORT}</dd>
            <dt>url</dt>
            <dd className="dl-url">{window.location.origin}</dd>
          </dl>
        </Card>

        <h2 className="dl-h2">Cross-origin, with CORS</h2>
        <Card title="VITE_API_URL">
          <dl className="dl-rows">
            <dt>GET</dt>
            <dd className="dl-url">{apiUrl}/api/items</dd>
            <dt>result</dt>
            <Outcome state={items} ok={(data) => `200 from lane ${data.lane}`} />
            {items.status === "ok" &&
              items.data.items.map((item) => [
                <dt key={`k${item.id}`} className="dl-key">{item.sku}</dt>,
                <dd key={`v${item.id}`}>
                  {item.name}, ${(item.price_cents / 100).toFixed(2)}
                </dd>,
              ])}
          </dl>
        </Card>

        <h2 className="dl-h2">Same origin, through Vite</h2>
        <Card title="server.proxy /proxied">
          <dl className="dl-rows">
            <dt>GET</dt>
            <dd className="dl-url">{window.location.origin}/proxied/lane</dd>
            <dt>result</dt>
            <Outcome state={proxied} ok={() => "200, no CORS headers needed"} />
          </dl>
          {proxied.status === "ok" && <pre>{JSON.stringify(proxied.data, null, 2)}</pre>}
        </Card>

        <h2 className="dl-h2">A cookie on the lane domain</h2>
        <Card title="session cookie">
          <dl className="dl-rows">
            <dt>last action</dt>
            {action ? <dd className={action.ok ? "dl-ok" : "dl-bad"}>{action.text}</dd> : <dd>none yet</dd>}
            <dt>document.cookie</dt>
            <dd>{cookie || "(empty)"}</dd>
            <dt>GET /api/me</dt>
            <Outcome
              state={me}
              ok={(data) => (data.signed_in ? `signed in as ${data.user} on lane ${data.lane}` : "not signed in")}
            />
          </dl>
        </Card>
        <p>
          <button className="dl-button" type="button" onClick={() => session("POST")}>Sign in</button>{" "}
          <button className="dl-button" type="button" onClick={() => session("DELETE")}>Sign out</button>
        </p>
      </main>

      <footer className="dl-footer">devlanes examples: web-frontend-api</footer>
    </div>
  );
}
