import { Card } from "@acme/ui";
import { Fragment } from "react";
import { accountsUrl } from "../api";
import { useAccounts } from "../useAccounts";

/** Every account with its plan and seats, fetched from this lane's API. */
export function AccountsCard() {
  const accounts = useAccounts();
  return (
    <Card title={accountsUrl}>
      <dl className="dl-rows">
        {accounts.status === "loading" && (
          <>
            <dt>result</dt>
            <dd>...</dd>
          </>
        )}
        {accounts.status === "error" && (
          <>
            <dt>result</dt>
            <dd className="dl-bad">{accounts.error}</dd>
          </>
        )}
        {accounts.status === "ok" &&
          accounts.data.accounts.map((account) => (
            <Fragment key={account.id}>
              <dt className="dl-key">{account.name}</dt>
              <dd>
                {account.plan}, {account.seats} seats
              </dd>
            </Fragment>
          ))}
      </dl>
    </Card>
  );
}
