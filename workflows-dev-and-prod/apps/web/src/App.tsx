import { useEffect } from "react";
import { fetchLane, fetchWebMode } from "./api";
import { ApiModeCard } from "./components/ApiModeCard";
import { LaneCard } from "./components/LaneCard";
import { Layout } from "./components/Layout";
import { Pending } from "./components/Pending";
import { WebModeCard } from "./components/WebModeCard";
import { env } from "./env";
import { useRequest } from "./useRequest";

/** The page: the lane card, then how `web` and `api` run in this lane right now. */
export function App() {
  const lane = useRequest(fetchLane);
  const mode = useRequest(fetchWebMode);
  const info = lane.status === "ok" ? lane.data : null;

  useEffect(() => {
    // Two lanes side by side get different card colours.
    if (info) document.body.style.setProperty("--dl-lane", `var(--dl-lane-${info.lane % 4})`);
  }, [info]);

  return (
    <Layout example="workflows-dev-and-prod">
      <h1 className="dl-title">
        This is lane {info?.lane ?? "..."} of{" "}
        <span className="nowrap">{info?.project ?? "..."}.</span>
      </h1>
      <p className="dl-lede">
        Served by <code>{info?.service ?? "web"}</code> from the worktree on{" "}
        <code>{info?.branch ?? "..."}</code>,{" "}
        {env.dev
          ? "as source files the Vite dev server compiles on request."
          : "as a production bundle that vite preview serves."}
      </p>
      {info ? <LaneCard info={info} /> : <Pending title="GET /lane" state={lane} />}

      <h2 className="dl-h2">Run mode of web</h2>
      {mode.status === "ok" ? (
        <WebModeCard mode={mode.data} />
      ) : (
        <Pending title="web: /mode" state={mode} />
      )}

      <h2 className="dl-h2">Run mode of api</h2>
      {mode.status === "ok" ? (
        <ApiModeCard apiUrl={mode.data.api_url} />
      ) : (
        <Pending title="api" state={mode} />
      )}
    </Layout>
  );
}
