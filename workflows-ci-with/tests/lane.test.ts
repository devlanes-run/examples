// Run through `devlanes with`, which sets the DEVLANES_PUBLIC_URL_* variables
// and NODE_EXTRA_CA_CERTS, so fetch trusts the lane's https:// hostnames.
import assert from "node:assert/strict";
import { test } from "node:test";
import { lane } from "./env.js";

const { api, web } = lane.urls;

/** GETs `url`, asserts a 200 and returns the response with its parsed JSON body. */
async function getJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(5_000) });
  assert.equal(res.status, 200, `${url} answered ${res.status}`);
  return { res, body: (await res.json()) as Record<string, unknown> };
}

test("devlanes with sets the lane's public URLs", () => {
  assert.match(api, /^https:\/\//, "DEVLANES_PUBLIC_URL_API");
  assert.match(web, /^https:\/\//, "DEVLANES_PUBLIC_URL_WEB");
});

for (const [service, url] of Object.entries(lane.urls)) {
  test(`${service} answers /lane for this lane through the proxy`, async () => {
    const { body } = await getJson(`${url}/lane`);
    assert.equal(body.project, lane.project);
    assert.equal(body.lane, lane.index);
    assert.equal(body.service, service);
    assert.equal(body.url, url);
  });
}

test("api runs the e2e profile's start script with NODE_ENV=test", async () => {
  const { body } = await getJson(`${api}/`);
  assert.equal(body.script, "start");
  assert.equal(body.node_env, "test");
});

test("api allows the web origin of this lane", async () => {
  const { res } = await getJson(`${api}/api/items`, { origin: web });
  assert.equal(res.headers.get("access-control-allow-origin"), web);
});

test("api sends no CORS header to another origin", async () => {
  const { res } = await getJson(`${api}/api/items`, { origin: "https://example.invalid" });
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});
