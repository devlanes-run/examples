import {
  LANE_DOMAIN,
  SITES_DOMAIN,
  TENANTS,
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
  const suffix = `.${SITES_DOMAIN}`;
  const name = host.endsWith(suffix) ? host.slice(0, -suffix.length) : host;
  const tenant = TENANTS[name];
  const jar = cookies(req);
  const app = `https://app.${LANE_DOMAIN}${portSuffix(req)}/`;

  const cookieRows = [
    ["Cookie header", req.headers.cookie ? esc(req.headers.cookie) : "(none)"],
    [
      "app session",
      jar.session
        ? `<span class="dl-bad">received ${esc(jar.session)}: the app's cookie leaked to a tenant</span>`
        : `<span class="dl-ok">not sent: ${esc(SITES_DOMAIN)} is another site than ${esc(LANE_DOMAIN)}</span>`,
    ],
  ];

  const cards = tenant
    ? [
        card(`tenant ${name}`, [
          ["tenant", `<span class="dl-ok">${esc(name)}</span> (from the Host header)`],
          ["shop", esc(tenant.shop)],
          ["path", esc(path)],
          ["items", tenant.items.map(esc).join(", ")],
        ]),
      ]
    : [
        card("unknown tenant", [
          ["tenant", `<span class="dl-bad">no tenant named ${esc(name)}</span>`],
        ]),
      ];
  cards.push(
    card("cookies", cookieRows),
    card("back", [["app", `<a href="${esc(app)}">${esc(app)}</a>`]]),
  );

  send(
    res,
    tenant ? 200 : 404,
    page(req, {
      lede: `The <code>sites</code> service of the <code>${esc(process.env.LANE_LABEL)}</code> worktree, serving <code>${esc(host)}</code> through the wildcard <code>*.${esc(SITES_DOMAIN)}</code>.`,
      cards,
    }),
  );
});
