import type { RequestState } from "../useRequest";
import { Card } from "./Card";

type PendingProps<T> = { title: string; state: RequestState<T> };

/** The card shown in place of one with values while its request is in flight or after it failed. */
export function Pending<T>({ title, state }: PendingProps<T>) {
  return (
    <Card title={title}>
      <dl className="dl-rows">
        <dt>status</dt>
        {state.status === "error" ? <dd className="dl-bad">{state.error}</dd> : <dd>...</dd>}
      </dl>
    </Card>
  );
}
