import type { FetchResult } from "@/lib/api";

type FetchResultCardProps = {
  /** The variable the address came from, shown in the card's title bar. */
  variable: string;
  result: FetchResult;
  /** Why this request succeeds, in one sentence. */
  note: string;
};

/** One request to the api service: its target, outcome, timing and what the API saw. */
export function FetchResultCard({ variable, result, note }: FetchResultCardProps) {
  const { answer } = result;
  return (
    <div className="dl-card">
      <div className="dl-bar">
        <span className="dl-dots">
          <i />
          <i />
          <i />
        </span>
        <span>fetch({variable})</span>
        <span />
      </div>
      <dl className="dl-rows">
        <dt>target</dt>
        <dd className="dl-url">{result.target}</dd>
        <dt>result</dt>
        <dd className={answer ? "dl-ok" : "dl-bad"}>
          {answer ? `${result.status} with ${answer.items.length} items` : result.error}
        </dd>
        <dt>time</dt>
        <dd>{result.ms.toFixed(1)} ms</dd>
        {answer && (
          <>
            <dt>api lane</dt>
            <dd>
              {answer.lane} <span className="dl-key">{answer.lane_name}</span>
            </dd>
            <dt>api saw</dt>
            <dd>
              {answer.url
                ? `X-Forwarded-Host, so ${answer.url}`
                : "no X-Forwarded-Host, a direct call"}
            </dd>
          </>
        )}
        <dt>why</dt>
        <dd>{note}</dd>
      </dl>
    </div>
  );
}
