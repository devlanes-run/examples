import type { RedisState } from "../redis.js";

/** This lane's database in the shared Redis, its visit count and the form that adds one. */
export function RedisCard({ redis }: { redis: RedisState }) {
  return (
    <>
      <div class="dl-card">
        <div class="dl-bar">
          <span class="dl-dots">
            <i />
            <i />
            <i />
          </span>
          <span>{"redis_db: ${{ lane.index }}"}</span>
          <span />
        </div>
        <dl class="dl-rows">
          <dt>port</dt>
          <dd>{redis.port}</dd>
          <dt>database</dt>
          <dd>{redis.db}</dd>
          <dt>visits</dt>
          <dd class="dl-ok">{redis.visits}</dd>
        </dl>
      </div>
      <form method="post" action="/visits">
        <button class="dl-button">Add a visit</button>
      </form>
    </>
  );
}
