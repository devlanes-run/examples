import { LaneCard, Page } from "@acme/ui";
import logo from "../brand/logo.svg";
import { AccountsCard } from "./components/AccountsCard";
import { env } from "./env";

/** The back office page: the lane and every account the API returns. */
export function App() {
  return (
    <Page
      logo={logo}
      lane={env}
      lede={
        <>
          The <code>{env.service}</code> service answered from the worktree on{" "}
          <code>{env.branch}</code>. The back office, a second Vite app in <code>apps/admin</code>{" "}
          that renders with the same <code>@acme/ui</code> components as{" "}
          <a href={env.webUrl}>web</a>.
        </>
      }
    >
      <LaneCard lane={env} />

      <h2 className="dl-h2">Accounts</h2>
      <AccountsCard />
    </Page>
  );
}
