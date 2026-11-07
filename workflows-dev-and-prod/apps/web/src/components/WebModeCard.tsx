import type { WebMode } from "../api";
import { env } from "../env";
import { Card } from "./Card";
import { ModeRow, Row } from "./Row";

/** How `web` runs: the Vite server, the npm script, the bundle and where the build went. */
export function WebModeCard({ mode }: { mode: WebMode }) {
  return (
    <Card title="web: /mode">
      <dl className="dl-rows">
        <Row label="server" value={mode.server} />
        <Row label="npm script" value={mode.script} />
        <ModeRow label="bundle" value={env.bundleMode} />
        <ModeRow label="NODE_ENV" value={mode.node_env} />
        <Row label="profile" value={mode.profile} />
        <Row label="project file" value={mode.project_file} />
        <Row
          label="build output"
          value={mode.out_dir ?? "none, the dev server compiles on request"}
        />
      </dl>
    </Card>
  );
}
