import { LaneCard, Page } from "@acme/ui";
import logo from "../brand/logo.svg";
import { AccountsCard } from "./components/AccountsCard";
import { LinksCard } from "./components/LinksCard";
import { env } from "./env";

/** The main app's page: the lane, the API's answer and links to the other apps. */
export function App() {
  return (
    <Page
      logo={logo}
      lane={env}
      lede={
        <>
          The <code>{env.service}</code> service answered from the worktree on{" "}
          <code>{env.branch}</code>. A Vite app in <code>apps/web</code> built on the workspace
          packages <code>@acme/ui</code> and <code>@acme/config</code>.
        </>
      }
    >
      <LaneCard lane={env} />

      <h2 className="dl-h2">The API</h2>
      <AccountsCard />

      <h2 className="dl-h2">Other apps</h2>
      <LinksCard />
    </Page>
  );
}
