import { postgresState, type PostgresState } from "./db.js";
import { redisState, type RedisState } from "./redis.js";

/** The lane's Postgres and its database in the shared Redis, as the page and /api/state show them. */
export type State = {
  postgres: PostgresState;
  redis: RedisState;
};

/** Reads both stores at once. */
export async function loadState(): Promise<State> {
  const [postgres, redis] = await Promise.all([postgresState(), redisState()]);
  return { postgres, redis };
}
