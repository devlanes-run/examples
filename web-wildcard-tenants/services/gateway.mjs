import {
  LANE_DOMAIN,
  card,
  cookies,
  esc,
  hostname,
  page,
  portSuffix,
  send,
  serve,
} from "../lib/shared.mjs";

serve((req, res, path) => {
  const host = hostname(req);
  const suffix = `.${LANE_DOMAIN}`;
  const subdomain = host.endsWith(suffix) ? host.slice(0, -suffix.length) : host;
  const session = cookies(req).session;
  const app = `https://app.${LANE_DOMAIN}${portSuffix(req)}/`;

  send(
    res,
    200,
    page(req, {
      lede: `The <code>gateway</code> service of the <code>${esc(process.env.LANE_LABEL)}</code> worktree. No other service claims <code>${esc(host)}</code>, so the fallback wildcard <code>*.${esc(LANE_DOMAIN)}</code> got it.`,
      cards: [
        card("request", [
          ["subdomain", `<span class="dl-url">${esc(subdomain)}</span>`],
          ["path", esc(path)],
          [
            "app session",
            session
              ? `<span class="dl-ok">${esc(session)}</span> (same site as the app)`
              : `none yet, open <a href="${esc(app)}">${esc(app)}</a> first`,
          ],
        ]),
      ],
    }),
  );
});
