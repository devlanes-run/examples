import { Card, ServicePage, type LaneInfo } from "@example-wildcard-tenants/shared";

type LinksPageProps = {
  info: LaneInfo;
  codes: { name: string; target: string }[];
  /** The path that matched no short code, when the page answers a 404. */
  missing?: string;
};

/** The list of short codes and the tenant pages they redirect to. */
export function LinksPage({ info, codes, missing }: LinksPageProps) {
  return (
    <ServicePage
      info={info}
      lede={
        <>
          The <code>links</code> service of the <code>{info.branch}</code> worktree.{" "}
          <code>go.</code> is an exact hostname, so it wins over the gateway's wildcard.
        </>
      }
    >
      <Card title="short codes">
        {missing && (
          <>
            <dt>requested</dt>
            <dd class="dl-bad">no short code {missing}</dd>
          </>
        )}
        {codes.map((code) => (
          <>
            <dt>/{code.name}</dt>
            <dd>
              <a href={`/${code.name}`}>{code.target}</a>
            </dd>
          </>
        ))}
      </Card>
    </ServicePage>
  );
}
