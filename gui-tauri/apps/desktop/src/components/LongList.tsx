import { env } from "../env";
import { Card } from "./Card";

const ROWS = Array.from({ length: 500 }, (_, index) => index + 1);

/** 500 rows in a scrolling box, for checking wheel and touchpad scrolling. */
export function LongList() {
  return (
    <Card title={`${ROWS.length} rows`}>
      <ol className="long-list">
        {ROWS.map((row) => (
          <li key={row}>
            row {row} <span className="dl-key">lane {env.lane}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
