import { Card } from "./Card";

const ROWS = Array.from({ length: 500 }, (_, index) => index + 1);

/** A box of 500 rows that scrolls on its own, to check wheel and scrollbar input. */
export function LongList() {
  return (
    <Card title={`${ROWS.length} rows`}>
      <ol className="long-list">
        {ROWS.map((row) => (
          <li key={row}>
            <span className="dl-key">row {row}</span> of {ROWS.length}
          </li>
        ))}
      </ol>
    </Card>
  );
}
