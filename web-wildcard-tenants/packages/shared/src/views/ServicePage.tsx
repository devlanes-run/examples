import type { Child } from "hono/jsx";
import type { LaneInfo } from "../lane.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";

type ServicePageProps = {
  info: LaneInfo;
  /** One sentence under the title on what this service did with the request. */
  lede: Child;
  children: Child;
};

/** The page every service renders: lane title, lede, lane card, then the service's own cards. */
export function ServicePage({ info, lede, children }: ServicePageProps) {
  return (
    <Layout
      title={`${info.service}: lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="web-wildcard-tenants"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">{lede}</p>
      <LaneCard info={info} />
      {children}
    </Layout>
  );
}
