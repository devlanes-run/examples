import type { LaneInfo } from "@mprocs-migration/shared";
import { Card } from "./Card.js";

/** The card with the lane values devlanes gave this service. */
export function LaneCard({ info }: { info: LaneInfo }) {
  return (
    <Card title={`${info.project}@${info.lane}:${info.service}`}>
      <dl class="dl-rows">
        <dt>lane</dt>
        <dd>
          {info.lane} <span class="dl-key">{info.lane_name}</span>
        </dd>
        <dt>branch</dt>
        <dd>{info.branch}</dd>
        <dt>service</dt>
        <dd>{info.service}</dd>
        <dt>port</dt>
        <dd>{info.port}</dd>
        <dt>url</dt>
        <dd>
          {info.url ? (
            <a href={info.url}>{info.url}</a>
          ) : (
            <span class="dl-bad">not through the proxy</span>
          )}
        </dd>
      </dl>
    </Card>
  );
}
