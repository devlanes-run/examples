const KEY = "views";

/** Adds one to the view counter in KV and returns the new count. */
export async function countView(kv: KVNamespace): Promise<number> {
  // KV has no atomic increment. Two requests at once can lose a view, which is fine for a demo
  // counter.
  const views = Number((await kv.get(KEY)) ?? 0) + 1;
  await kv.put(KEY, String(views));
  return views;
}
