import { randomBytes } from "node:crypto";
import { LANE_DOMAIN, SITES_DOMAIN, TENANTS, card, cookies, esc, page, portSuffix, send, serve } from "../lib/shared.mjs";

serve((req, res, path) => {
  if (path !== "/") return send(res, 404, "not found\n", { "content-type": "text/plain" });

  const port = portSuffix(req);
  const headers = {};
  let session = cookies(req).session;
  if (!session) {
    session = randomBytes(6).toString("hex");
    // Domain= makes the cookie reach every name under the lane domain (go., the gateway's
    // subdomains), and no name under the tenant sites' domain.
    headers["set-cookie"] = `session=${session}; Domain=${LANE_DOMAIN}; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Lax`;
  }

  const tenantRows = Object.entries(TENANTS).map(([name, t]) => {
    const url = `https://${name}.${SITES_DOMAIN}${port}/`;
    return [name, `<a href="${esc(url)}">${esc(url)}</a> ${esc(t.shop)}`];
  });
  const go = `https://go.${LANE_DOMAIN}${port}`;
  const unknown = `https://billing.${LANE_DOMAIN}${port}/`;

  send(
    res,
    200,
    page(req, {
      lede: `The <code>app</code> service of the <code>${esc(process.env.LANE_LABEL)}</code> worktree. It set a session cookie for <code>${esc(LANE_DOMAIN)}</code>; tenant pages live on <code>${esc(SITES_DOMAIN)}</code>, a site of their own.`,
      cards: [
        card("session cookie", [
          ["session", `<span class="dl-ok">${esc(session)}</span>`],
          ["Domain", esc(LANE_DOMAIN)],
          ["flags", "Max-Age=86400; Secure; HttpOnly; SameSite=Lax"],
        ]),
        card("tenants", tenantRows),
        card("other hostnames", [
          ["short links", `<a href="${esc(go)}/hello">${esc(go)}/hello</a>, <a href="${esc(go)}/sale">${esc(go)}/sale</a>`],
          ["no service", `<a href="${esc(unknown)}">${esc(unknown)}</a> (the gateway answers)`],
        ]),
      ],
    }),
    headers,
  );
});
