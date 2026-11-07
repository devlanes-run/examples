const items = [
  { id: 1, sku: "ACME-101", name: "Tornado seeds", price_cents: 1250 },
  { id: 2, sku: "ACME-102", name: "Earthquake pills", price_cents: 3400 },
  { id: 3, sku: "ACME-103", name: "Dehydrated boulders", price_cents: 899 },
];

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

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const route = `${request.method} ${pathname}`;

    switch (route) {
      case "GET /healthz":
        return new Response("ok");
      case "GET /lane":
        return json(laneInfo(request, env));
      case "GET /":
        return json({ ...laneInfo(request, env), items });
      case "GET /api/items": {
        // KV has no atomic increment. Two requests at once can lose a view,
        // which is fine for a demo counter.
        const views = Number((await env.VIEWS.get("views")) ?? 0) + 1;
        await env.VIEWS.put("views", String(views));
        return json({ lane: Number(env.DEVLANES_LANE), views, items });
      }
      default:
        return json({ error: `no route for ${route}` }, 404);
    }
  },
};
