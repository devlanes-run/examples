import { LaneCard } from "./components/LaneCard";
import { LaneLinks } from "./components/LaneLinks";
import { Layout } from "./components/Layout";
import { MailPanel } from "./components/MailPanel";
import { OrdersCard } from "./components/OrdersCard";
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

/** The page: the lane card, the orders from the lane's database and the mail form. */
export function App() {
  return (
    <Layout example="showcase-tui-tour">
      <h1 className="dl-title">
        This is lane {info.lane} of <span className="nowrap">{info.project}.</span>
      </h1>
      <p className="dl-lede">
        The <code>{info.service}</code> service (Vite) answered from the worktree on{" "}
        <code>{info.branch}</code>. The orders below come from <code>api</code> in the same lane.
      </p>
      <LaneCard info={info} />
      <LaneLinks />

      <h2 className="dl-h2">Orders from api</h2>
      <OrdersCard />

      <h2 className="dl-h2">Send a mail</h2>
      <p className="dl-lede">
        <code>api</code> puts the mail on this lane's Redis queue, <code>worker</code> sends it over
        SMTP, and it lands in the lane's own Mailpit at <a href={env.mailUrl}>{env.mailUrl}</a>.
      </p>
      <MailPanel />
    </Layout>
  );
}
