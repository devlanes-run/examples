import { laneInfo } from "@provider-stubs/shared";
import { Hono, type Context } from "hono";
import { csrf } from "hono/csrf";
import { env } from "../env.js";
import {
  accepted,
  providers,
  type Fields,
  type ProviderName,
  type SendResult,
} from "../providers/index.js";
import { HomePage } from "../views/HomePage.js";

/** `POST /send/<provider>` for the page's forms and `POST /api/<provider>` for scripts. */
export const sendRoutes = new Hono();

// Form posts must come from one of this lane's origins.
sendRoutes.use("/send/*", csrf({ origin: env.origins }));

for (const name of Object.keys(providers) as ProviderName[]) {
  const provider = providers[name];

  sendRoutes.post(`/send/${name}`, async (c) => {
    const result = await provider.send(stringFields(await c.req.parseBody()));
    c.status(accepted(result) ? 200 : 502);
    return c.render(<HomePage info={laneInfo(c, env)} last={{ name, result }} />);
  });

  sendRoutes.post(`/api/${name}`, async (c) => {
    const fields = await jsonFields(c);
    if (!fields) {
      return c.json({ error: "invalid_request", message: "body is not valid JSON" }, 400);
    }
    const result = shortenErrorPage(await provider.send(fields));
    return c.json(result, accepted(result) ? 201 : 502);
  });
}

async function jsonFields(c: Context): Promise<Fields | undefined> {
  try {
    return stringFields(await c.req.json());
  } catch {
    return undefined;
  }
}

function stringFields(input: unknown): Fields {
  if (typeof input !== "object" || input === null) return {};
  return Object.fromEntries(
    Object.entries(input).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

// Keeps the heading and first sentence of a proxy error page; the HTML page shows all of it.
function shortenErrorPage(result: SendResult): SendResult {
  if (!("body" in result) || typeof result.body !== "string") return result;
  return { ...result, body: result.body.split("\n").slice(0, 3).join("\n") };
}
