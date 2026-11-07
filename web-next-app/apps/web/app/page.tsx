import { headers } from "next/headers";
import { FetchResultCard } from "@/components/FetchResultCard";
import { LaneCard } from "@/components/LaneCard";
import { fetchApi } from "@/lib/api";
import { env } from "@/lib/env";
import { laneInfo } from "@/lib/lane";

/** The lane card, then the api service fetched through the proxy and straight to its port. */
export default async function HomePage() {
  const info = laneInfo((await headers()).get("x-forwarded-host"));
  const { apiPublicUrl, apiUrl, domain } = env();
  // One after the other, so each timing covers a single request.
  const viaProxy = await fetchApi(apiPublicUrl);
  const direct = await fetchApi(apiUrl);

  return (
    <>
      <h1 className="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p className="dl-lede">
        The <code>{info.service}</code> service, a Next.js server component behind{" "}
        <code>{domain}</code>, answered from the worktree on <code>{info.branch}</code>.
      </p>
      <LaneCard info={info} />

      <h2 className="dl-h2">The API, fetched twice on the server</h2>
      <p className="dl-lede">
        This page fetched the lane's <a href={apiPublicUrl}>api</a> service while it rendered: once
        through the HTTPS proxy and once straight to its port.
      </p>
      <FetchResultCard
        variable="API_PUBLIC_URL"
        result={viaProxy}
        note="HTTPS through the proxy. Node trusts the devlanes CA because devlanes set NODE_EXTRA_CA_CERTS for this service."
      />
      <FetchResultCard
        variable="API_URL"
        result={direct}
        note="Plain HTTP to 127.0.0.1, the server-to-server address. No proxy, no TLS."
      />

      <div className="dl-card">
        <dl className="dl-rows">
          <dt>GET /lane</dt>
          <dd>
            <a href="/lane">the values above as JSON</a>
          </dd>
          <dt>GET /healthz</dt>
          <dd>
            <a href="/healthz">the ready check</a>: <span className="dl-ok">ok</span>
          </dd>
        </dl>
      </div>
    </>
  );
}
