import type { DotenvFile, DotenvKey, LaneInfo } from "@example-dotenv/config";
import { env } from "../env.js";
import type { OrdersCheck } from "../orders.js";
import { ChecksCard } from "./ChecksCard.js";
import { DotenvCard } from "./DotenvCard.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";
import { UrlsCard } from "./UrlsCard.js";

type HomePageProps = {
  info: LaneInfo;
  file: DotenvFile | null;
  keys: DotenvKey[];
  orders: OrdersCheck;
};

/** The web page: the lane, what reached the process from `.env` and the URLs from one domain. */
export function HomePage({ info, file, keys, orders }: HomePageProps) {
  const { urls } = env;
  return (
    <Layout title={`Lane ${info.lane} of ${info.project}`} lane={info.lane} assets={urls.assets}>
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Keys from .env in this process</h2>
      <p class="dl-lede">
        devlanes reads <code>.env</code> only for the <code>{"${{ env.X }}"}</code> expressions in{" "}
        <code>devlanes.yaml</code>. A key reaches the process only when <code>global_env</code>{" "}
        names it, so <code>ACME_ADMIN_PASSWORD</code> stays out. Secret values are hidden here.
      </p>
      <DotenvCard file={file} keys={keys} />

      <h2 class="dl-h2">Every URL from one domain</h2>
      <p class="dl-lede">
        devlanes sets <code>APP_DOMAIN</code> to the lane's domain. <code>packages/config</code>{" "}
        builds the rest, so lane 1 gets its own set without a second <code>.env</code>.
      </p>
      <UrlsCard urls={urls} />
      <ChecksCard orders={orders} sessionUrl={`${urls.api}/api/session`} sentry={env.sentry} />
    </Layout>
  );
}
