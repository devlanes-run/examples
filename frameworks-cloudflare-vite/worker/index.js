const items = [
  { id: 1, sku: "ACME-001", name: "Anvil", price_cents: 4999 },
  { id: 2, sku: "ACME-002", name: "Rocket skates", price_cents: 12900 },
  { id: 3, sku: "ACME-003", name: "Giant magnet", price_cents: 2450 },
];

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
    inspector_port: Number(env.INSPECTOR_PORT),
    state_path: env.STATE_PATH ?? ".wrangler/state",
  };
}

async function readCount(env) {
  return Number((await env.COUNTER.get("count")) ?? 0);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/healthz") {
      return new Response("ok", { headers: { "content-type": "text/plain; charset=utf-8" } });
    }
    if (pathname === "/lane" || pathname === "/api/lane") {
      return Response.json(laneInfo(request, env));
    }
    if (pathname === "/api/items") {
      return Response.json({ ...laneInfo(request, env), items });
    }
    if (pathname === "/api/counter") {
      if (request.method === "POST") {
        await env.COUNTER.put("count", String((await readCount(env)) + 1));
      } else if (request.method !== "GET") {
        return Response.json({ error: "method not allowed" }, { status: 405 });
      }
      return Response.json({ count: await readCount(env) });
    }
    return Response.json({ error: `no route for ${pathname}` }, { status: 404 });
  },
};
