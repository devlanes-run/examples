import { apiUrl } from "./api";
import { ItemsList } from "./components/ItemsList";
import { LaneCard } from "./components/LaneCard";
import { Layout } from "./components/Layout";
import { ProxiedLane } from "./components/ProxiedLane";
import { SessionPanel } from "./components/SessionPanel";
import { env } from "./env";

const info = {
  project: env.project,
  lane: env.lane,
  lane_name: env.laneName,
  branch: env.branch,
  service: env.service,
  port: env.port,
  url: window.location.origin,
};

/** The page: the lane card, then the API reached cross-origin, through Vite and with a cookie. */
export function App() {
  return (
    <Layout example="web-frontend-api">
      <h1 className="dl-title">
        This is lane {info.lane} of <span className="nowrap">{info.project}.</span>
      </h1>
      <p className="dl-lede">
        Served by <code>{info.service}</code> from the worktree on <code>{info.branch}</code>. The
        browser calls <code>api</code> at {apiUrl} with CORS, and through <code>/proxied</code> on
        this host without it.
      </p>
      <LaneCard info={info} />

      <h2 className="dl-h2">Cross-origin, with CORS</h2>
      <ItemsList />

      <h2 className="dl-h2">Same origin, through Vite</h2>
      <ProxiedLane />

      <h2 className="dl-h2">A cookie on the lane domain</h2>
      <SessionPanel />
    </Layout>
  );
}
