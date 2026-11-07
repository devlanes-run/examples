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

type Accounts =
  | { status: "loading" }
  | { status: "ok"; lane: number; accounts: Account[] }
  | { status: "error"; error: string };

function useAccounts(): Accounts {
  const [state, setState] = useState<Accounts>({ status: "loading" });
  useEffect(() => {
    fetch(`${env.apiUrl}/api/accounts`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(
        (data) => setState({ status: "ok", ...data }),
        (error: Error) => setState({ status: "error", error: error.message }),
      );
  }, []);
  return state;
}

export default function App() {
  const accounts = useAccounts();

  return (
    <Page
      logo={logo}
      lane={env}
      lede={
        <>
          Served by <code>{env.service}</code> from the <code>{env.branch}</code> worktree. A Vite app in{" "}
          <code>apps/web</code> built on the workspace packages <code>@acme/ui</code> and <code>@acme/config</code>.
        </>
      }
    >
      <LaneCard lane={env} />

      <h2 className="dl-h2">The API</h2>
      <Card title="VITE_API_URL" lane={env.lane}>
        <dl className="dl-rows">
          <dt>GET</dt>
          <dd className="dl-url">{env.apiUrl}/api/accounts</dd>
          <dt>result</dt>
          {accounts.status === "loading" && <dd>...</dd>}
          {accounts.status === "error" && <dd className="dl-bad">{accounts.error}</dd>}
          {accounts.status === "ok" && <dd className="dl-ok">200 from lane {accounts.lane}</dd>}
          {accounts.status === "ok" &&
            accounts.accounts.map((account) => [
              <dt key={`k${account.id}`} className="dl-key">{account.plan}</dt>,
              <dd key={`v${account.id}`}>{account.name}</dd>,
            ])}
        </dl>
      </Card>

      <h2 className="dl-h2">Other apps</h2>
      <Card title="links" lane={env.lane}>
        <dl className="dl-rows">
          <dt>admin</dt>
          <dd><a href={env.adminUrl}>{env.adminUrl}</a></dd>
          <dt>api</dt>
          <dd><a href={env.apiUrl}>{env.apiUrl}</a></dd>
          <dt>billing</dt>
          {env.billingUrl ? (
            <dd><a href={env.billingUrl}>{env.billingUrl}</a> (project pnpm-billing)</dd>
          ) : (
            <dd className="dl-bad">
              no lane of pnpm-billing runs; start one in apps/billing, then devlanes restart web
            </dd>
          )}
        </dl>
      </Card>
    </Page>
  );
}
