import { Card } from "./Card";

/** The lane values every example shows; `url` is the page's own origin. */
export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string;
};

/** The card with the lane values devlanes gave this service. */
export function LaneCard({ info }: { info: LaneInfo }) {
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
          <a href={info.url}>{info.url}</a>
        </dd>
      </dl>
    </Card>
  );
}
