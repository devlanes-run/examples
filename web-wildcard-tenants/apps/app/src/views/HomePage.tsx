import { Card, env, ServicePage, type LaneInfo } from "@example-wildcard-tenants/shared";
import { SESSION_FLAGS } from "../session.js";

type HomePageProps = {
  info: LaneInfo;
  session: string;
  tenants: { name: string; shop: string; url: string }[];
  /** The short-link origin, `https://go.<lane domain>`. */
  goUrl: string;
  /** A subdomain of the lane that no service claims, so the gateway answers it. */
  unclaimedUrl: string;
};

/** The product page: the session cookie it set and links to every other hostname of the lane. */
export function HomePage({ info, session, tenants, goUrl, unclaimedUrl }: HomePageProps) {
  return (
    <ServicePage
      info={info}
      lede={
        <>
          The <code>app</code> service of the <code>{info.branch}</code> worktree. It set a session
          cookie for <code>{env.domain}</code>; tenant pages live on <code>{env.sitesDomain}</code>,
          a site of their own.
        </>
      }
    >
      <Card title="session cookie">
        <dt>session</dt>
        <dd class="dl-ok">{session}</dd>
        <dt>Domain</dt>
        <dd>{env.domain}</dd>
        <dt>flags</dt>
        <dd>{SESSION_FLAGS}</dd>
      </Card>
      <Card title="tenants">
        {tenants.map((tenant) => (
          <>
            <dt>{tenant.name}</dt>
            <dd>
              <a href={tenant.url}>{tenant.url}</a> {tenant.shop}
            </dd>
          </>
        ))}
      </Card>
      <Card title="other hostnames">
        <dt>short links</dt>
        <dd>
          <a href={`${goUrl}/hello`}>{goUrl}/hello</a>, <a href={`${goUrl}/sale`}>{goUrl}/sale</a>
        </dd>
        <dt>no service</dt>
        <dd>
          <a href={unclaimedUrl}>{unclaimedUrl}</a> (the gateway answers)
        </dd>
      </Card>
    </ServicePage>
  );
}
