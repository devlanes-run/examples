// Run through `devlanes with`, which sets the DEVLANES_PUBLIC_URL_* variables
// and NODE_EXTRA_CA_CERTS, so fetch trusts the lane's https:// hostnames.
import { test } from "node:test";
import assert from "node:assert/strict";

const api = process.env.DEVLANES_PUBLIC_URL_API;
const web = process.env.DEVLANES_PUBLIC_URL_WEB;
const lane = Number(process.env.DEVLANES_LANE);

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  assert.equal(res.status, 200, `${url} answered ${res.status}`);
  return { res, body: await res.json() };
}

test("devlanes with sets the lane's public URLs", () => {
  assert.match(api ?? "", /^https:\/\//, "DEVLANES_PUBLIC_URL_API");
  assert.match(web ?? "", /^https:\/\//, "DEVLANES_PUBLIC_URL_WEB");
});

for (const [service, url] of [["api", api], ["web", web]]) {
  test(`${service} answers /lane for this lane through the proxy`, async () => {
    const { body } = await getJson(`${url}/lane`);
    assert.equal(body.project, process.env.DEVLANES_LANE_PROJECT);
    assert.equal(body.lane, lane);
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
