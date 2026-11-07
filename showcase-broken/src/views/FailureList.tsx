import type { Failure } from "../failures.js";

/** A card with one row per failure: the error, where to see it and the command that triggers it. */
export function FailureList({ failures }: { failures: Failure[] }) {
  return (
    <div class="dl-card">
      <dl class="dl-rows">
        {failures.map((failure) => (
          <>
            <dt class="dl-key">{failure.service}</dt>
            <dd>
              <span class="dl-bad">{failure.error}</span>
              {failure.url && (
                <>
                  {" at "}
                  <a href={failure.url}>{failure.url}</a>
                </>
              )}
              <br />
              {failure.description}
              <br />
              <code class="dl-ok">$ {failure.command}</code>
            </dd>
          </>
        ))}
      </dl>
    </div>
  );
}
