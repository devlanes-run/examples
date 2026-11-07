import type { ApiResult } from "../client.js";
import type { ApiTarget } from "../env.js";
import type { ApiIndex } from "../records.js";

type ApiCardProps = {
  api: ApiTarget;
  result: ApiResult;
  /** A form button that asks this page's server to add a record through the API. */
  add?: { action: string; label: string };
};

/** One API a page calls: the URLs it uses, the lane that answered and the records it read. */
export function ApiCard({ api, result, add }: ApiCardProps) {
  return (
    <div class="dl-card">
      <div class="dl-bar">
        <span class="dl-dots">
          <i />
          <i />
          <i />
        </span>
        <span>{api.name}</span>
        <span />
      </div>
      <dl class="dl-rows">
        <dt>public_url</dt>
        <dd>
          <a href={api.publicUrl}>{api.publicUrl}</a>
        </dd>
        <dt>fetched from</dt>
        <dd>{api.url}</dd>
        {result.ok ? (
          <AnswerRows index={result.index} add={add} />
        ) : (
          <>
            <dt>answered by</dt>
            <dd class="dl-bad">
              nothing: {result.error}, {api.name} is not running
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}

function AnswerRows({ index, add }: { index: ApiIndex; add: ApiCardProps["add"] }) {
  return (
    <>
      <dt>answered by</dt>
      <dd class="dl-ok">
        lane {index.lane} <span class="dl-key">{index.lane_name}</span>
      </dd>
      <dt>data file</dt>
      <dd>{index.data_file}</dd>
      <dt>{index.records}</dt>
      <dd>
        {index.items.length}
        {index.items.map((item) => (
          <>
            <br />
            {item.name}
          </>
        ))}
      </dd>
      {add && (
        <>
          <dt />
          <dd>
            <form method="post" action={add.action}>
              <button class="dl-button">{add.label}</button>
            </form>
          </dd>
        </>
      )}
    </>
  );
}
