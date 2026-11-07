import { useEffect, useState } from "react";
import { pageEnv } from "@acme/config";
import { Card, LaneCard, Page } from "@acme/ui";
import logo from "@acme/ui/logo.svg";

const env = pageEnv(import.meta.env);

interface Account {
  id: number;
  name: string;
  plan: string;
  seats: number;
}

export default function App() {
  const [accounts, setAccounts] = useState<Account[] | string>("loading");

  useEffect(() => {
    fetch(`${env.apiUrl}/api/accounts`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(
        (data) => setAccounts(data.accounts),
        (error: Error) => setAccounts(error.message),
      );
  }, []);

  return (
    <Page
      logo={logo}
      lane={env}
      lede={
        <>
          Served by <code>{env.service}</code> from the <code>{env.branch}</code> worktree. The back office, a
          second Vite app in <code>apps/admin</code> that renders with the same <code>@acme/ui</code> components
          as <a href={env.webUrl}>web</a>.
        </>
      }
    >
      <LaneCard lane={env} />

      <h2 className="dl-h2">Accounts</h2>
      <Card title={`${env.apiUrl}/api/accounts`} lane={env.lane}>
        <dl className="dl-rows">
          {typeof accounts === "string" ? (
            <>
              <dt>result</dt>
              <dd className={accounts === "loading" ? undefined : "dl-bad"}>{accounts}</dd>
            </>
          ) : (
            accounts.map((account) => [
              <dt key={`k${account.id}`} className="dl-key">{account.name}</dt>,
              <dd key={`v${account.id}`}>
                {account.plan}, {account.seats} seats
              </dd>,
            ])
          )}
        </dl>
      </Card>
    </Page>
  );
}
