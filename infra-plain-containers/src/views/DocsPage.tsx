import type { LaneInfo } from "../lane.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

/** The docs server's page: the lane that started it and the hostname this request used. */
export function DocsPage({ info }: { info: LaneInfo }) {
  return (
    <Layout title={`Docs of ${info.project}`} lane={info.lane} example="infra-plain-containers">
      <h1 class="dl-title">
        Docs of {info.project}, started in lane {info.lane}.
      </h1>
      <p class="dl-lede">
        One <code>npm run docs</code> process on 127.0.0.1:{info.port}, declared under{" "}
        <code>infra.external</code> in <code>devlanes.local.yaml</code>. Every lane routes its own
        docs hostname here; this request came in as <code>{info.url ?? "a direct request"}</code>.
      </p>
      <LaneCard info={info} />
    </Layout>
  );
}
