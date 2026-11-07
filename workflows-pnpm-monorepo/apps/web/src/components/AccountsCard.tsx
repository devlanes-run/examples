import { Card } from "@acme/ui";
import { Fragment } from "react";
import { accountsUrl } from "../api";
import { useAccounts } from "../useAccounts";

/** The accounts fetched from `VITE_API_URL`, and which lane's API answered. */
export function AccountsCard() {
  const accounts = useAccounts();
  return (
    <Card title="VITE_API_URL">
      <dl className="dl-rows">
        <dt>GET</dt>
        <dd className="dl-url">{accountsUrl}</dd>
        <dt>result</dt>
        {accounts.status === "loading" && <dd>...</dd>}
        {accounts.status === "error" && <dd className="dl-bad">{accounts.error}</dd>}
        {accounts.status === "ok" && <dd className="dl-ok">200 from lane {accounts.data.lane}</dd>}
        {accounts.status === "ok" &&
          accounts.data.accounts.map((account) => (
            <Fragment key={account.id}>
              <dt className="dl-key">{account.plan}</dt>
              <dd>{account.name}</dd>
            </Fragment>
          ))}
      </dl>
    </Card>
  );
}
