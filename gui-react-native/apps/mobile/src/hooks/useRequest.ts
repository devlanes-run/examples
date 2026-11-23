import { useEffect, useState } from "react";

/** The state of one request: nothing yet, its value, or the error it failed with. */
export type RequestState<T> =
  { status: "loading" } | { status: "ok"; value: T } | { status: "failed"; error: string };

/** Runs `load` once when the component mounts and tracks its result. */
export function useRequest<T>(load: () => Promise<T>): RequestState<T> {
  const [state, setState] = useState<RequestState<T>>({ status: "loading" });

  useEffect(() => {
    let current = true;
    load().then(
      (value) => current && setState({ status: "ok", value }),
      (error: unknown) => current && setState({ status: "failed", error: String(error) }),
    );
    return () => {
      current = false;
    };
  }, [load]);

  return state;
}
