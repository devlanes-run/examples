import { useEffect, useState } from "react";

/** The state of one request: in flight, answered, or failed with a message. */
export type RequestState<T> =
  { status: "loading" } | { status: "ok"; data: T } | { status: "error"; error: string };

/** Runs `load` on mount, and again whenever `load` changes. */
export function useRequest<T>(load: () => Promise<T>): RequestState<T> {
  const [state, setState] = useState<RequestState<T>>({ status: "loading" });
  useEffect(() => {
    load().then(
      (data) => setState({ status: "ok", data }),
      (error: unknown) =>
        setState({
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }),
    );
  }, [load]);
  return state;
}
