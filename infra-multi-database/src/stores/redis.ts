import { createClient } from "redis";
import { env } from "../env.js";
import { TIMEOUT_MS, namespaceOf, now, plural, type Store } from "./store.js";

const index = namespaceOf(env.redisUrl);

const client = createClient({ url: env.redisUrl, socket: { connectTimeout: TIMEOUT_MS } });
// The client reconnects on its own; log the failures instead of crashing on them.
client.on("error", (err: Error) => console.error("redis:", err.message));
client.connect().catch(() => {});

function connected() {
  if (!client.isReady) throw new Error("not connected");
  return client;
}

/** A database index per lane in the shared Redis. */
export const redis: Store = {
  key: "redis",
  title: "Redis",
  container: "shared",
  kind: "database index",
  namespace: index,
  envVar: "REDIS_URL",
  access: { shell: `docker compose -p ${env.project} exec redis redis-cli -n ${index}` },

  async health() {
    const redis = connected();
    const [pong, size, owner] = await Promise.all([
      redis.ping(),
      redis.dbSize(),
      // infra.setup.redis writes this key when it claims the index for the lane.
      redis.get("lane:owner"),
    ]);
    return `PING ${pong}, ${plural(size, "key")}, lane:owner = ${owner ?? "(unset)"}`;
  },

  async demo() {
    const redis = connected();
    const clicks = await redis.incr("clicks");
    await redis.set("last_click", now());
    return [`INCR clicks -> ${clicks}`, `GET last_click -> ${await redis.get("last_click")}`];
  },
};
