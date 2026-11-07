import { Card, LaneCard, Layout, type LaneInfo } from "@provider-stubs/shared";
import { providers, type ProviderName, type SendResult } from "../providers/index.js";
import { ResultCard } from "./ResultCard.js";
import { SendForms } from "./SendForms.js";

type HomePageProps = {
  info: LaneInfo;
  /** The send the page answers, when it is the response to a form post. */
  last?: { name: ProviderName; result: SendResult };
};

/** The api's page: the lane, the provider URLs devlanes gave it and a form per provider. */
export function HomePage({ info, last }: HomePageProps) {
  return (
    <Layout title={`${info.service}, lane ${info.lane} of ${info.project}`} lane={info.lane}>
      <h1 class="dl-title">
        This is lane {info.lane} of {info.project}.
      </h1>
      <p class="dl-lede">
        The <code>{info.service}</code> service answered from the worktree on{" "}
        <code>{info.branch}</code>. It sends SMS and email through the provider URLs devlanes gave
        this lane.
      </p>
      <LaneCard info={info} />

      {last && (
        <>
          <h2 class="dl-h2">Last send</h2>
          <ResultCard name={last.name} result={last.result} />
        </>
      )}

      <h2 class="dl-h2">Providers</h2>
      <Card title="provider client">
        <dl class="dl-rows">
          <dt>SMS_API_URL</dt>
          <dd>
            <a href={providers.sms.url}>{providers.sms.url}</a>
          </dd>
          <dt>EMAIL_API_URL</dt>
          <dd>
            <a href={providers.email.url}>{providers.email.url}</a>
          </dd>
        </dl>
      </Card>

      <h2 class="dl-h2">Send</h2>
      <SendForms />
    </Layout>
  );
}
