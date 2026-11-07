import type { IDToken } from "openid-client";
import { serverEnv } from "../env.js";
import type { LaneInfo } from "../lane.js";
import type { ProviderInfo } from "../oidc.js";
import type { Settled } from "../settle.js";
import type { WhoamiInfo } from "../whoami.js";
import { ClaimsCard } from "./ClaimsCard.js";
import { LaneCard } from "./LaneCard.js";
import { Layout } from "./Layout.js";
import { ProviderCard } from "./ProviderCard.js";
import { WhoamiCard } from "./WhoamiCard.js";

type HomePageProps = {
  info: LaneInfo;
  claims: IDToken | undefined;
  provider: Settled<ProviderInfo>;
  shared: Settled<WhoamiInfo>;
};

/** The lane page: lane values, the login against the lane's provider and the shared whoami. */
export function HomePage({ info, claims, provider, shared }: HomePageProps) {
  const env = serverEnv();
  return (
    <Layout
      title={`Lane ${info.lane} of ${info.project}`}
      lane={info.lane}
      example="infra-plain-containers"
    >
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>. It logs in against this lane's own OIDC provider container and
        reads from a whoami container that every lane shares.
      </p>
      <LaneCard info={info} />

      <h2 class="dl-h2">Login</h2>
      <ClaimsCard claims={claims} domain={env.domain} />

      <h2 class="dl-h2">OIDC provider, this lane only</h2>
      <ProviderCard provider={provider} port={env.oidcPort} />
      <p class="dl-lede">
        <a href={`${env.oidcIssuer}/.well-known/openid-configuration`}>discovery document</a>
      </p>

      <h2 class="dl-h2">whoami, shared by every lane</h2>
      <WhoamiCard shared={shared} url={env.whoamiUrl} />
    </Layout>
  );
}
