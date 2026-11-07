import { Card } from "./Card.js";

/** The link to the other project's web app, or how to get one while none of its lanes runs. */
export function MonorepoCard({ url }: { url: string | undefined }) {
  return (
    <Card title="MONOREPO_WEB_URL">
      <dl class="dl-rows">
        <dt>web</dt>
        {url ? (
          <dd>
            <a href={url}>{url}</a> (project example-pnpm-monorepo)
          </dd>
        ) : (
          <dd class="dl-bad">
            no lane of example-pnpm-monorepo runs; start one at the example's root, then devlanes
            restart web here
          </dd>
        )}
      </dl>
    </Card>
  );
}
