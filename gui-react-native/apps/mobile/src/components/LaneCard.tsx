import type { LaneInfo } from "../lane";
import { laneColor } from "../theme";
import { Row, Tone } from "./Row";
import { TerminalCard } from "./TerminalCard";

type LaneCardProps = {
  info: LaneInfo;
  /** The Metro origin the app loaded its bundle from, the native app's page URL. */
  origin: string;
};

/** The terminal-style card with the lane values of the metro service that served this app. */
export function LaneCard({ info, origin }: LaneCardProps) {
  return (
    <TerminalCard
      title={`${info.project}@${info.lane}:${info.service}`}
      laneColor={laneColor(info.lane)}
    >
      <Row label="lane">
        {info.lane} <Tone tone="key">{info.lane_name}</Tone>
      </Row>
      <Row label="branch">{info.branch}</Row>
      <Row label="service">{info.service}</Row>
      <Row label="port">{info.port}</Row>
      <Row label="url">
        <Tone tone="url">{origin}</Tone>
      </Row>
    </TerminalCard>
  );
}
