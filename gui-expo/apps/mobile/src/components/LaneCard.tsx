import type { LaneInfo } from "../lane";
import { colors, laneColor } from "../theme";
import { Card, CardText, Row } from "./Card";

/** The card with the lane values devlanes gave the `expo` service. */
export function LaneCard({ info }: { info: LaneInfo }) {
  return (
    <Card title={`${info.project}@${info.lane}:${info.service}`} accent={laneColor(info.lane)}>
      <Row label="lane">
        <CardText>
          {info.lane} <CardText color={colors.key}>{info.lane_name}</CardText>
        </CardText>
      </Row>
      <Row label="branch">
        <CardText>{info.branch}</CardText>
      </Row>
      <Row label="service">
        <CardText>{info.service}</CardText>
      </Row>
      <Row label="port">
        <CardText>{info.port}</CardText>
      </Row>
      <Row label="url">
        <CardText color={colors.url}>{info.url}</CardText>
      </Row>
    </Card>
  );
}
