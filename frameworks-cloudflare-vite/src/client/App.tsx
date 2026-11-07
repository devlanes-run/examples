import { fetchLane } from "./api";
import { CounterCard } from "./components/CounterCard";
import { InspectorCard } from "./components/InspectorCard";
import { ItemsCard } from "./components/ItemsCard";
import { LaneCard } from "./components/LaneCard";
import { Layout } from "./components/Layout";
import { useRequest } from "./useRequest";

/** The page: the lane as the Worker reports it, its items, its KV counter and its inspector. */
export function App() {
  const [lane] = useRequest(fetchLane);
  return (
    <Layout example="frameworks-cloudflare-vite">
      {lane.status === "loading" && <h1 className="dl-title">Asking the Worker...</h1>}
      {lane.status === "error" && (
        <h1 className="dl-title">The Worker did not answer /api/lane: {lane.error}</h1>
      )}
      {lane.status === "ok" && (
        <>
          <h1 className="dl-title">
            This is lane {lane.data.lane} of <span className="nowrap">{lane.data.project}.</span>
          </h1>
          <p className="dl-lede">
            Served by <code>{lane.data.service}</code> from the worktree on{" "}
            <code>{lane.data.branch}</code>. Vite serves this page, and a Worker running in workerd
            inside the same Vite answers <code>/api/*</code>.
          </p>
          <LaneCard info={lane.data} />

          <h2 className="dl-h2">Items from the Worker</h2>
          <ItemsCard />

          <h2 className="dl-h2">A counter per lane</h2>
          <CounterCard statePath={lane.data.state_path} />

          <h2 className="dl-h2">The Worker's inspector</h2>
          <InspectorCard port={lane.data.inspector_port} />
        </>
      )}
    </Layout>
  );
}
