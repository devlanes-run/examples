import { useCallback } from "react";
import { fetchApiRoot } from "../api";
import { useRequest } from "../useRequest";
import { Card } from "./Card";
import { Pending } from "./Pending";
import { ModeRow, Row } from "./Row";

const CODE = { src: "src/*.ts through tsx watch", dist: "dist/*.js built by tsc" };

/** How `api` runs, read cross-origin from its `/`, with the releases it serves. */
export function ApiModeCard({ apiUrl }: { apiUrl: string }) {
  const api = useRequest(useCallback(() => fetchApiRoot(apiUrl), [apiUrl]));
  const title = `GET ${apiUrl}/`;
  if (api.status !== "ok") return <Pending title={title} state={api} />;

  const { mode, releases } = api.data;
  return (
    <Card title={title}>
      <dl className="dl-rows">
        <Row label="npm script" value={mode.script} />
        <Row label="code" value={CODE[mode.runs_from]} />
        <ModeRow label="NODE_ENV" value={mode.node_env} />
        <Row label="profile" value={mode.profile} />
        <Row label="project file" value={mode.project_file} />
        <Row label="LOG_LEVEL" value={mode.log_level} />
        <Row label="api lane" value={`${api.data.lane} of ${api.data.project}`} className="dl-ok" />
      </dl>
      <dl className="dl-rows">
        {releases.map((release) => (
          <Row
            key={release.version}
            label={release.version}
            value={`${release.channel}, ${release.date}`}
          />
        ))}
      </dl>
    </Card>
  );
}
