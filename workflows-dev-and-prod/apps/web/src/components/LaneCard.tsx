import type { LaneInfo } from "../api";
import { Card } from "./Card";

/** The card with the lane values devlanes gave this service; `url` is the page's own origin. */
export function LaneCard({ info }: { info: LaneInfo }) {
  const url = window.location.origin;
  return (
    <Card title={`${info.project}@${info.lane}:${info.service}`}>
      <dl className="dl-rows">
        <dt>lane</dt>
        <dd>
          {info.lane} <span className="dl-key">{info.lane_name}</span>
        </dd>
        <dt>branch</dt>
        <dd>{info.branch}</dd>
        <dt>service</dt>
        <dd>{info.service}</dd>
        <dt>port</dt>
        <dd>{info.port}</dd>
        <dt>url</dt>
        <dd>
          <a href={url}>{url}</a>
        </dd>
      </dl>
    </Card>
  );
}
