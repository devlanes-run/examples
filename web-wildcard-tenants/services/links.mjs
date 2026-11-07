import { SITES_DOMAIN, card, esc, page, portSuffix, send, serve } from "../lib/shared.mjs";

const CODES = {
  hello: { tenant: "alice", path: "/" },
  sale: { tenant: "bob", path: "/sale" },
};

serve((req, res, path) => {
  const target = (code) => `https://${code.tenant}.${SITES_DOMAIN}${portSuffix(req)}${code.path}`;
  const code = CODES[path.slice(1)];
  if (code) {
    res.writeHead(302, { location: target(code) });
    return res.end();
  }

  const rows = Object.entries(CODES).map(([name, c]) => [
    `/${name}`,
    `<a href="/${esc(name)}">${esc(target(c))}</a>`,
  ]);
  const known = path === "/";
  if (!known) rows.unshift(["requested", `<span class="dl-bad">no short code ${esc(path)}</span>`]);
  send(
    res,
    known ? 200 : 404,
    page(req, {
      lede: `The <code>links</code> service of the <code>${esc(process.env.LANE_LABEL)}</code> worktree. <code>go.</code> is an exact hostname, so it wins over the gateway's wildcard.`,
      cards: [card("short codes", rows)],
    }),
  );
});
