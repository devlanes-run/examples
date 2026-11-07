import type { RequestState } from "../useRequest";

type OutcomeProps<T> = {
  state: RequestState<T>;
  /** The text shown when the request answered. */
  ok: (data: T) => string;
};

/** A `<dd>` with a request's result: green when it answered, red with the error otherwise. */
export function Outcome<T>({ state, ok }: OutcomeProps<T>) {
  if (state.status === "loading") return <dd>...</dd>;
  if (state.status === "error") {
    return <dd className="dl-bad">{state.error} (blocked by CORS? see the browser console)</dd>;
  }
  return <dd className="dl-ok">{ok(state.data)}</dd>;
}
