import type { ReactNode } from "react";
import type { RequestState } from "../useRequest";

type OutcomeProps<T> = {
  state: RequestState<T>;
  /** What to show once the request answered. */
  ok: (data: T) => ReactNode;
};

/** A `<dd>` with a request's result: green when it answered, red with the error otherwise. */
export function Outcome<T>({ state, ok }: OutcomeProps<T>) {
  if (state.status === "loading") return <dd>...</dd>;
  if (state.status === "error") return <dd className="dl-bad">{state.error}</dd>;
  return <dd className="dl-ok">{ok(state.data)}</dd>;
}
