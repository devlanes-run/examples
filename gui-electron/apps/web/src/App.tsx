import { ApiCard } from "./components/ApiCard";
import { DesktopCard } from "./components/DesktopCard";
import { LaneCard } from "./components/LaneCard";
import { Layout } from "./components/Layout";
import { LongList } from "./components/LongList";
import { NativeCard } from "./components/NativeCard";
import { TypingCard } from "./components/TypingCard";
import { desktop, windowNumber } from "./desktop";
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

/** The renderer: the lane card, the API's answer, the Electron shell and the input surfaces. */
export function App() {
  return (
    <Layout example="gui-electron">
      <h1 className="dl-title">
        This is lane {info.lane} of <span className="nowrap">{info.project}.</span>
      </h1>
      <p className="dl-lede">
        Served by <code>{info.service}</code> from the worktree on <code>{info.branch}</code>
        {desktop
          ? `, in window ${windowNumber ?? "?"} of the lane's Electron app.`
          : ", in a browser. The native parts need the Electron window."}
      </p>
      <LaneCard info={info} />

      <h2 className="dl-h2">The API</h2>
      <ApiCard />

      {desktop && (
        <>
          <h2 className="dl-h2">The Electron shell</h2>
          <DesktopCard desktop={desktop} />
          <NativeCard desktop={desktop} />
        </>
      )}

      <h2 className="dl-h2">Typing and scrolling</h2>
      <TypingCard />
      <LongList />
    </Layout>
  );
}
