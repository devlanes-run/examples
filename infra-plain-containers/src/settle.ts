/** A value, or the message of the error that prevented it, for pages that show failures. */
export type Settled<T> = { value: T } | { error: string };

/** Waits for a promise and keeps its error message instead of throwing. */
export function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ value }),
    (err: unknown) => ({ error: err instanceof Error ? err.message : String(err) }),
  );
}
