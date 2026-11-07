const KEY = "count";

/** Reads the lane's count from the `COUNTER` KV namespace, 0 before the first increment. */
export async function readCount(kv: KVNamespace): Promise<number> {
  return Number((await kv.get(KEY)) ?? 0);
}

/** Adds one to the count and returns the new value. */
export async function incrementCount(kv: KVNamespace): Promise<number> {
  const count = (await readCount(kv)) + 1;
  await kv.put(KEY, String(count));
  return count;
}
