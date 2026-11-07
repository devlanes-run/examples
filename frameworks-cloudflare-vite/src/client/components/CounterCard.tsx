import { fetchCount, incrementCount } from "../api";
import { useRequest } from "../useRequest";
import { Card } from "./Card";
import { Outcome } from "./Outcome";

/** The lane's count in the `COUNTER` KV namespace, with a button that adds one. */
export function CounterCard({ statePath }: { statePath: string }) {
  const [count, run] = useRequest(fetchCount);
  return (
    <>
      <Card title="KV binding COUNTER">
        <dl className="dl-rows">
          <dt>count</dt>
          <Outcome state={count} ok={(data) => data.count} />
          <dt>persisted to</dt>
          <dd className="dl-url">{statePath}</dd>
        </dl>
      </Card>
      <p className="counter-actions">
        <button className="dl-button" type="button" onClick={() => run(incrementCount)}>
          Count one more
        </button>
      </p>
    </>
  );
}
