import { Card } from "@acme/ui";
import { env } from "../env";

/** Links to the lane's other apps, and to billing when a lane of that project runs. */
export function LinksCard() {
  return (
    <Card title="links">
      <dl className="dl-rows">
        <dt>admin</dt>
        <dd>
          <a href={env.adminUrl}>{env.adminUrl}</a>
        </dd>
        <dt>api</dt>
        <dd>
          <a href={env.apiUrl}>{env.apiUrl}</a>
        </dd>
        <dt>billing</dt>
        {env.billingUrl ? (
          <dd>
            <a href={env.billingUrl}>{env.billingUrl}</a> (project example-pnpm-billing)
          </dd>
        ) : (
          <dd className="dl-bad">
            no lane of example-pnpm-billing runs; start one in apps/billing, then devlanes restart
            web
          </dd>
        )}
      </dl>
    </Card>
  );
}
