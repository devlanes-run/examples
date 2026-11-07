import { useCallback, useEffect, useState } from "react";

/** The state of one request: in flight, answered, or failed with a message. */
export type RequestState<T> =
  { status: "loading" } | { status: "ok"; data: T } | { status: "error"; error: string };

/**
 * Runs `load` on mount and returns its state with a function that runs `load` again, or another
 * request whose answer replaces the state (a `POST` that returns the new value).
 */
export function useRequest<T>(
  load: () => Promise<T>,
): [RequestState<T>, (request?: () => Promise<T>) => void] {
  const [state, setState] = useState<RequestState<T>>({ status: "loading" });
  const run = useCallback(
    (request: () => Promise<T> = load) => {
      request().then(
        (data) => setState({ status: "ok", data }),
        (error: unknown) =>
          setState({
            status: "error",
            error: error instanceof Error ? error.message : String(error),
          }),
      );
    },
    [load],
  );
  useEffect(() => run(), [run]);
  return [state, run];
}
