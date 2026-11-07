import type { LaneInfo } from "../lane.js";
import type { Row } from "../probe.js";
import { seconds } from "../stats.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

function ServiceRow({ row }: { row: Row }) {
  const { stats } = row;
  return (
    <tr>
      <td>
        <a href={row.link}>{row.name}</a>
      </td>
      <td>{stats ? <span class={`kind-${stats.kind}`}>{stats.kind}</span> : null}</td>
      <td>
        {stats ? (
          <span class="dl-ok">ready after {seconds(stats.ready_after_ms ?? 0)} s</span>
        ) : (
          <span class="dl-bad">no answer ({row.error})</span>
        )}
      </td>
      <td class="num">{stats?.bursts}</td>
      <td class="num">{stats?.cpu_ms}</td>
    </tr>
  );
}

/** The lane's home page: every service, whether it answers, and its CPU numbers. */
export function IndexPage({ info, rows }: { info: LaneInfo; rows: Row[] }) {
  const up = rows.filter((row) => row.stats).length;
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="showcase-many-services"
      refresh={2}
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">
        {up} of {rows.length} services answer
      </h2>
      <p class="dl-lede">
        This page asks every service of the lane for <code>/stats</code> and reloads every 2
        seconds. Each name links to the service: its hostname when it has one, else its{" "}
        <code>127.0.0.1</code> port.
      </p>
      <div class="dl-card wide">
        <div class="dl-bar">
          <span class="dl-dots">
            <i />
            <i />
            <i />
          </span>
          <span>services</span>
          <span />
        </div>
        <div class="units">
          <table>
            <thead>
              <tr>
                <th>service</th>
                <th>kind</th>
                <th>state</th>
                <th class="num">bursts</th>
                <th class="num">cpu ms</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ServiceRow row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
