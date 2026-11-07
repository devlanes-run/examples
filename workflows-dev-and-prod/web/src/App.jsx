import { useEffect, useState } from "react";

const repo = "https://github.com/devlanes-run/examples/tree/main/workflows-dev-and-prod";
// Fixed when the bundle is made: "development" from the dev server, "production" from vite build.
const bundleMode = import.meta.env.MODE;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function useJson(url) {
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    if (!url) return;
    getJson(url).then(
      (data) => setState({ status: "ok", data }),
      (error) => setState({ status: "error", error: error.message }),
    );
  }, [url]);
  return state;
}

function Card({ title, lane, children }) {
  return (
    <section className="dl-card" style={{ "--dl-lane": `var(--dl-lane-${(lane ?? 0) % 4})` }}>
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

function Rows({ rows }) {
  return (
    <dl className="dl-rows">
      {rows.map(([key, value, className]) => [
        <dt key={`k-${key}`}>{key}</dt>,
        <dd key={`v-${key}`} className={className}>
          {value ?? "(unset)"}
        </dd>,
      ])}
    </dl>
  );
}

function Failed({ state }) {
  if (state.status === "loading") return <Rows rows={[["status", "..."]]} />;
  return <Rows rows={[["status", state.error, "dl-bad"]]} />;
}

const production = (value) => (value === "production" ? "dl-ok" : "dl-key");

export default function App() {
  const lane = useJson("/lane");
  const mode = useJson("/mode");
  const api = useJson(mode.status === "ok" ? `${mode.data.api_url}/` : null);
  const info = lane.status === "ok" ? lane.data : null;
  const index = info?.lane;

  return (
    <div className="dl-page">
      <header className="dl-header">
        <a className="dl-brand" href="/">
          <img src="/logo.svg" alt="" width="32" height="32" />
          devlanes
        </a>
        <nav className="dl-nav">
          <a href={repo}>workflows-dev-and-prod on GitHub</a>
        </nav>
      </header>

      <main className="dl-main">
        <h1 className="dl-title">
          This is lane {info ? info.lane : "..."} of{" "}
          <span style={{ whiteSpace: "nowrap" }}>{info ? info.project : "..."}.</span>
        </h1>
        <p className="dl-lede">
          Served by <code>{info?.service ?? "web"}</code> from the{" "}
          <code>{info?.branch ?? "..."}</code> worktree,{" "}
          {import.meta.env.DEV
            ? "as source files the Vite dev server compiles on request."
            : "as a production bundle that vite preview serves."}
        </p>

        <Card title="lane" lane={index}>
          {info ? (
            <Rows
              rows={[
                ["lane", `${info.lane} (${info.lane_name})`],
                ["branch", info.branch],
                ["service", info.service],
                ["port", info.port],
                ["url", window.location.origin, "dl-url"],
              ]}
            />
          ) : (
            <Failed state={lane} />
          )}
        </Card>

        <h2 className="dl-h2">Run mode of web</h2>
        <Card title="web: /mode" lane={index}>
          {mode.status === "ok" ? (
            <Rows
              rows={[
                ["server", mode.data.server],
                ["npm script", mode.data.script],
                ["bundle", bundleMode, production(bundleMode)],
                ["NODE_ENV", mode.data.node_env, production(mode.data.node_env)],
                ["profile", mode.data.profile],
                ["project file", mode.data.project_file],
                ["build output", mode.data.out_dir ?? "none, the dev server compiles on request"],
              ]}
            />
          ) : (
            <Failed state={mode} />
          )}
        </Card>

        <h2 className="dl-h2">Run mode of api</h2>
        <Card title={mode.status === "ok" ? `GET ${mode.data.api_url}/` : "api"} lane={index}>
          {api.status === "ok" ? (
            <>
              <Rows
                rows={[
                  ["npm script", api.data.mode.script],
                  ["node --watch", api.data.mode.watch ? "yes" : "no"],
                  ["NODE_ENV", api.data.mode.node_env, production(api.data.mode.node_env)],
                  ["profile", api.data.mode.profile],
                  ["project file", api.data.mode.project_file],
                  ["LOG_LEVEL", api.data.mode.log_level],
                  ["api lane", `${api.data.lane} of ${api.data.project}`, "dl-ok"],
                ]}
              />
              <Rows rows={api.data.releases.map((r) => [r.version, `${r.channel}, ${r.date}`])} />
            </>
          ) : (
            <Failed state={api} />
          )}
        </Card>
      </main>

      <footer className="dl-footer">devlanes examples: workflows-dev-and-prod</footer>
    </div>
  );
}
