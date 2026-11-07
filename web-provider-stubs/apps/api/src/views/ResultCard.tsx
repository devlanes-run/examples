import { Card } from "@provider-stubs/shared";
import { accepted, providers, type ProviderName, type SendResult } from "../providers/index.js";

/** The last send from the page's forms, with the message id or the provider's error. */
export function ResultCard({ name, result }: { name: ProviderName; result: SendResult }) {
  const provider = providers[name];
  const title = `${provider.label} -> ${result.provider}`;
  if (accepted(result) && "body" in result) {
    return (
      <Card title={title}>
        <dl class="dl-rows">
          <dt>status</dt>
          <dd>
            <span class="dl-ok">
              {result.status} accepted as {messageId(result.body)}
            </span>
          </dd>
          <dt>inbox</dt>
          <dd>
            <a href={provider.url}>{provider.url}</a>
          </dd>
        </dl>
      </Card>
    );
  }
  return (
    <Card title={title}>
      <dl class="dl-rows">
        <dt>status</dt>
        <dd>
          <span class="dl-bad">
            {result.status ?? result.error}
            {"devlanes_error" in result && result.devlanes_error && (
              <>
                {" "}
                <span class="dl-key">x-devlanes-error: {result.devlanes_error}</span>
              </>
            )}
          </span>
        </dd>
      </dl>
      {"body" in result && <pre>{bodyText(result.body)}</pre>}
    </Card>
  );
}

function messageId(body: unknown): string {
  return typeof body === "object" && body !== null && "id" in body ? String(body.id) : "";
}

function bodyText(body: unknown): string {
  return typeof body === "string" ? body : JSON.stringify(body, null, 2);
}
