import {
  Card,
  env,
  ServicePage,
  type LaneInfo,
  type Tenant,
} from "@example-wildcard-tenants/shared";

type TenantPageProps = {
  info: LaneInfo;
  host: string;
  /** The subdomain the request named, which is the tenant when one exists. */
  name: string;
  tenant: Tenant | undefined;
  path: string;
  cookieHeader: string | null;
  /** The app's session cookie, which must never arrive here. */
  session: string | null;
  appUrl: string;
};

/** A tenant's page, or a 404 page for a subdomain with no tenant, plus the cookies that arrived. */
export function TenantPage(props: TenantPageProps) {
  const { info, host, name, tenant, path, cookieHeader, session, appUrl } = props;
  return (
    <ServicePage
      info={info}
      lede={
        <>
          The <code>sites</code> service of the <code>{info.branch}</code> worktree, serving{" "}
          <code>{host}</code> through the wildcard <code>*.{env.sitesDomain}</code>.
        </>
      }
    >
      {tenant ? (
        <Card title={`tenant ${name}`}>
          <dt>tenant</dt>
          <dd>
            <span class="dl-ok">{name}</span> (from the Host header)
          </dd>
          <dt>shop</dt>
          <dd>{tenant.shop}</dd>
          <dt>path</dt>
          <dd>{path}</dd>
          <dt>items</dt>
          <dd>{tenant.items.join(", ")}</dd>
        </Card>
      ) : (
        <Card title="unknown tenant">
          <dt>tenant</dt>
          <dd class="dl-bad">no tenant named {name}</dd>
        </Card>
      )}
      <Card title="cookies">
        <dt>Cookie header</dt>
        <dd>{cookieHeader ?? "(none)"}</dd>
        <dt>app session</dt>
        {session ? (
          <dd class="dl-bad">received {session}: the app's cookie leaked to a tenant</dd>
        ) : (
          <dd class="dl-ok">
            not sent: {env.sitesDomain} is another site than {env.domain}
          </dd>
        )}
      </Card>
      <Card title="back">
        <dt>app</dt>
        <dd>
          <a href={appUrl}>{appUrl}</a>
        </dd>
      </Card>
    </ServicePage>
  );
}
