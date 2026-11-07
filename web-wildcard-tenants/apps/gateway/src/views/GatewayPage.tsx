import { Card, env, ServicePage, type LaneInfo } from "@example-wildcard-tenants/shared";

type GatewayPageProps = {
  info: LaneInfo;
  host: string;
  subdomain: string;
  path: string;
  /** The app's session cookie, which reaches every name under the lane domain. */
  session: string | null;
  appUrl: string;
};

/** The catch-all page naming the subdomain nothing else claimed. */
export function GatewayPage({ info, host, subdomain, path, session, appUrl }: GatewayPageProps) {
  return (
    <ServicePage
      info={info}
      lede={
        <>
          The <code>gateway</code> service of the <code>{info.branch}</code> worktree. No other
          service claims <code>{host}</code>, so the fallback wildcard <code>*.{env.domain}</code>{" "}
          got it.
        </>
      }
    >
      <Card title="request">
        <dt>subdomain</dt>
        <dd class="dl-url">{subdomain}</dd>
        <dt>path</dt>
        <dd>{path}</dd>
        <dt>app session</dt>
        {session ? (
          <dd>
            <span class="dl-ok">{session}</span> (same site as the app)
          </dd>
        ) : (
          <dd>
            none yet, open <a href={appUrl}>{appUrl}</a> first
          </dd>
        )}
      </Card>
    </ServicePage>
  );
}
