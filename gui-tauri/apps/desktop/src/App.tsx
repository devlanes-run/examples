import { ApiCard } from "./components/ApiCard";
import { DesktopCard } from "./components/DesktopCard";
import { LaneCard } from "./components/LaneCard";
import { Layout } from "./components/Layout";
import { LongList } from "./components/LongList";
import { NativePanel } from "./components/NativePanel";
import { TextInput } from "./components/TextInput";
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

/** The main window: the lane card, the API's answer, then the native parts to try. */
export function App() {
  return (
    <Layout example="gui-tauri">
      <h1 className="dl-title">
        This is lane {info.lane} of <span className="nowrap">{info.project}.</span>
      </h1>
      <p className="dl-lede">
        A Tauri window showing the page <code>{info.service}</code> serves from the worktree on{" "}
        <code>{info.branch}</code>. It calls <code>api</code> in the same lane.
      </p>
      <LaneCard info={info} />
      <DesktopCard />

      <h2 className="dl-h2">The API</h2>
      <ApiCard />

      <h2 className="dl-h2">Native parts</h2>
      <NativePanel />

      <h2 className="dl-h2">Typing and scrolling</h2>
      <TextInput />
      <LongList />
    </Layout>
  );
}
