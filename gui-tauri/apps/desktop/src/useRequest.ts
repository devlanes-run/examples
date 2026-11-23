import { useCallback, useEffect, useState } from "react";

/** The state of one request: in flight, answered, or failed with a message. */
export type RequestState<T> =
  { status: "loading" } | { status: "ok"; data: T } | { status: "error"; error: string };

/** Runs `load` on mount and returns its state with a function that runs it again. */
export function useRequest<T>(load: () => Promise<T>): [RequestState<T>, () => void] {
  const [state, setState] = useState<RequestState<T>>({ status: "loading" });
  const reload = useCallback(() => {
    load().then(
      (data) => setState({ status: "ok", data }),
      (error: unknown) =>
        setState({
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }),
    );
  }, [load]);
  useEffect(reload, [reload]);
  return [state, reload];
}
