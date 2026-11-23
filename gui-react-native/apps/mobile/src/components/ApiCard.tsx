import type { RequestState } from "../hooks/useRequest";
import type { ApiAnswer } from "../lane";
import { laneColor } from "../theme";
import { Row, Tone } from "./Row";
import { TerminalCard } from "./TerminalCard";

type ApiCardProps = {
  answer: RequestState<ApiAnswer>;
  /** The app's own lane, which the API's lane should match. */
  lane: number;
};

/** The API's answer to `GET /api/`, which Metro forwards to the lane's api service. */
export function ApiCard({ answer, lane }: ApiCardProps) {
  return (
    <TerminalCard title="GET /api/" laneColor={laneColor(lane)}>
      {answer.status === "loading" && <Row label="api">asking...</Row>}
      {answer.status === "failed" && (
        <Row label="api">
          <Tone tone="bad">{answer.error}</Tone>
        </Row>
      )}
      {answer.status === "ok" && (
        <>
          <Row label="lane">
            {answer.value.lane === lane ? (
              <Tone tone="ok">{answer.value.lane}, the same as the app</Tone>
            ) : (
              <Tone tone="bad">
                {answer.value.lane}, not the app's lane {lane}
              </Tone>
            )}
          </Row>
          <Row label="service">{answer.value.service}</Row>
          <Row label="port">{answer.value.port}</Row>
          {answer.value.orders.map((order) => (
            <Row key={order.id} label={`#${order.id}`}>
              {order.item} <Tone tone="key">{order.status}</Tone>
            </Row>
          ))}
        </>
      )}
    </TerminalCard>
  );
}
