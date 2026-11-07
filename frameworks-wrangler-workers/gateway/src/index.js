const REPO_URL = "https://github.com/devlanes-run/examples/tree/main/frameworks-wrangler-workers";

// Workers do not see the process environment, so the lane values arrive as
// vars from wrangler.vars in devlanes.yaml.
function laneInfo(request, env) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  return {
    project: env.DEVLANES_LANE_PROJECT,
    lane: Number(env.DEVLANES_LANE),
    lane_name: env.DEVLANES_LANE_NAME,
    branch: env.LANE_LABEL,
    service: env.DEVLANES_SERVICE,
    port: Number(env.PORT),
    url: forwardedHost ? `https://${forwardedHost}` : new URL(request.url).origin,
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function readJson(responsePromise) {
  try {
    const response = await responsePromise;
    if (!response.ok) return { error: `catalog answered ${response.status}: ${await response.text()}` };
    return await response.json();
  } catch (error) {
    return { error: String(error) };
  }
}

// The host in this URL is ignored: a service binding delivers the request to
// the catalog worker that the lane's dev registry lists.
function fetchCatalog(env) {
  return readJson(env.CATALOG.fetch("http://catalog/api/items"));
}

// An ordinary fetch to the catalog's lane hostname. workerd resolves the name
// itself, which is what lanes.hosts_file in devlanes.yaml is for.
function fetchCatalogByHostname(env) {
  return readJson(fetch(`${env.CATALOG_URL}/lane`));
}

function sameLane(other, lane) {
  return other === lane
    ? `<span class="dl-ok">${other}, same lane as this gateway</span>`
    : `<span class="dl-bad">${escape(other)}, another lane</span>`;
}

function card(title, lane, body) {
  return `<section class="dl-card" style="--dl-lane: var(--dl-lane-${lane % 4})">
  <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>${escape(title)}</span><span></span></div>
  ${body}
</section>`;
}

function link(url) {
  return `<a href="${escape(url)}">${escape(url)}</a>`;
}

function rows(entries) {
  return `<dl class="dl-rows">${entries.map(([key, value]) => `<dt>${escape(key)}</dt><dd>${value}</dd>`).join("")}</dl>`;
}

function page(info, catalog, byHostname, env) {
  const lane = info.lane;
  const inspect = (name) => `https://inspect-${name}.${env.LANE_DOMAIN}/json`;
  const catalogCard = catalog.error
    ? rows([["error", `<span class="dl-bad">${escape(catalog.error)}</span>`]])
    : rows([
        ["catalog lane", sameLane(catalog.lane, lane)],
        ["views", `<span class="dl-key">${catalog.views}</span> in this lane's KV`],
        ...catalog.items.map((item) => [item.sku, `${escape(item.name)}, $${(item.price_cents / 100).toFixed(2)}`]),
      ]);
  const hostnameCard = byHostname.error
    ? rows([["error", `<span class="dl-bad">${escape(byHostname.error)}</span>`]])
    : rows([
        ["catalog lane", sameLane(byHostname.lane, lane)],
        ["url", `<span class="dl-url">${escape(byHostname.url)}</span>`],
      ]);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lane ${lane} of ${escape(info.project)}</title>
  <link rel="icon" href="/logo.svg">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap">
  <link rel="stylesheet" href="/devlanes.css">
</head>
<body>
  <div class="dl-page">
    <header class="dl-header">
      <a class="dl-brand" href="/"><img src="/logo.svg" alt="" width="32" height="32">devlanes</a>
      <nav class="dl-nav"><a href="${REPO_URL}">frameworks-wrangler-workers on GitHub</a></nav>
    </header>
    <main class="dl-main">
      <h1 class="dl-title">This is lane ${lane} of ${escape(info.project)}.</h1>
      <p class="dl-lede">The <code>${escape(info.service)}</code> worker answered from the worktree of <code>${escape(info.branch)}</code>, and called the <code>catalog</code> worker through a service binding.</p>
      ${card(`${info.service} worker`, lane, rows([
        ["lane", `${lane} (${escape(info.lane_name)})`],
        ["branch", escape(info.branch)],
        ["service", escape(info.service)],
        ["port", escape(info.port)],
        ["url", `<span class="dl-url">${escape(info.url)}</span>`],
      ]))}
      ${card("service binding: env.CATALOG.fetch(\"/api/items\")", lane, catalogCard)}
      ${card(`by hostname: fetch("${env.CATALOG_URL}/lane")`, lane, hostnameCard)}
      ${card("links", lane, rows([
        ["catalog", link(env.CATALOG_URL)],
        ["as JSON", `${link(`${env.PUBLIC_BASE_URL}/api/catalog`)}<br>${link(`${env.PUBLIC_BASE_URL}/api/catalog-by-hostname`)}`],
        ["inspectors", `${link(inspect("gateway"))}<br>${link(inspect("catalog"))}`],
      ]))}
    </main>
    <footer class="dl-footer">${escape(info.project)} lane ${lane}</footer>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const route = `${request.method} ${pathname}`;

    switch (route) {
      case "GET /healthz":
        return new Response("ok");
      case "GET /lane":
        return json(laneInfo(request, env));
      case "GET /api/catalog":
        return json({ gateway_lane: Number(env.DEVLANES_LANE), catalog: await fetchCatalog(env) });
      case "GET /api/catalog-by-hostname":
        return json({ gateway_lane: Number(env.DEVLANES_LANE), catalog: await fetchCatalogByHostname(env) });
      case "GET /": {
        const [catalog, byHostname] = await Promise.all([fetchCatalog(env), fetchCatalogByHostname(env)]);
        const html = page(laneInfo(request, env), catalog, byHostname, env);
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
      }
      default:
        return json({ error: `no route for ${route}` }, 404);
    }
  },
};
