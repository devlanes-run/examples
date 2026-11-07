import { Card } from "./Card.js";

/** The lane values a page shows; the same shape as `Lane` in `@acme/config`. */
export type LaneProps = {
  project: string;
  lane: number;
  laneName: string;
  branch: string;
  service: string;
  port: number;
};

/** The card with the lane values devlanes gave this service; `url` is the page's own origin. */
export function LaneCard({ lane }: { lane: LaneProps }) {
  const url = window.location.origin;
  return (
    <Card title={`${lane.project}@${lane.lane}:${lane.service}`}>
      <dl className="dl-rows">
        <dt>lane</dt>
        <dd>
          {lane.lane} <span className="dl-key">{lane.laneName}</span>
        </dd>
        <dt>branch</dt>
        <dd>{lane.branch}</dd>
        <dt>service</dt>
        <dd>{lane.service}</dd>
        <dt>port</dt>
        <dd>{lane.port}</dd>
        <dt>url</dt>
        <dd>
          <a href={url}>{url}</a>
        </dd>
      </dl>
    </Card>
  );
}
