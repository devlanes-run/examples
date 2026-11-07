/** Where a provider's API is and the key it expects. */
export type ProviderConfig = { url: string; key: string };

/** The outcome of one call to a provider, as the page and `/api/*` show it. */
export type SendResult =
  | { provider: string; status: number; devlanes_error?: string; body: unknown }
  | { provider: string; status: null; error: string };

const TIMEOUT_MS = 10_000;

/** Posts a message to `<url>/v1/messages`, the API both the stubs and the real providers expose. */
export async function postMessage(config: ProviderConfig, message: object): Promise<SendResult> {
  const target = new URL("/v1/messages", config.url).href;
  try {
    // HTTPS through the devlanes proxy; Node trusts its CA through NODE_EXTRA_CA_CERTS.
    const res = await fetch(target, {
      method: "POST",
      headers: { authorization: `Bearer ${config.key}`, "content-type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await readBody(res);
    // Set when the devlanes proxy answered instead of the provider, such as service-idle.
    const devlanesError = res.headers.get("x-devlanes-error");
    return devlanesError
      ? { provider: target, status: res.status, devlanes_error: devlanesError, body }
      : { provider: target, status: res.status, body };
  } catch (err) {
    return { provider: target, status: null, error: errorCode(err) };
  }
}

/** Whether the provider accepted the message. */
export function accepted(result: SendResult): boolean {
  return result.status !== null && result.status >= 200 && result.status < 300;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // The proxy's error pages are Markdown for clients that do not ask for HTML.
    return text;
  }
}

// fetch wraps network failures, so the useful part (ECONNREFUSED, ENOTFOUND) is on the cause.
function errorCode(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const cause = err.cause;
  if (typeof cause === "object" && cause !== null && "code" in cause) return String(cause.code);
  return err.message;
}
