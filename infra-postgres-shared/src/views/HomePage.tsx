import type { LaneInfo } from "../lane.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";
import { NotesCard, type NotesResult } from "./NotesCard.js";

type HomePageProps = {
  info: LaneInfo;
  notes: NotesResult;
};

/** The lane page: the lane values, the lane's database and its notes. */
export function HomePage({ info, notes }: HomePageProps) {
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="infra-postgres-shared"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service of the worktree on <code>{info.branch}</code>,
        reading notes from its own database in the shared Postgres container:
      </p>
      <p class="pg-database">{info.database}</p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Notes</h2>
      <NotesCard database={info.database} notes={notes} />

      <div class="dl-card">
        <dl class="dl-rows">
          <dt>GET /api/notes</dt>
          <dd>
            <a href="/api/notes">the notes as JSON</a>
          </dd>
          <dt>GET /lane</dt>
          <dd>
            <a href="/lane">the lane values as JSON</a>
          </dd>
          <dt>GET /healthz</dt>
          <dd>
            <a href="/healthz">the ready check</a>: <span class="dl-ok">ok</span>
          </dd>
        </dl>
      </div>
    </Layout>
  );
}
