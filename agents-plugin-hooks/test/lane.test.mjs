import { test } from "node:test";
import assert from "node:assert/strict";

// devlanes with sets one DEVLANES_PUBLIC_URL_<SERVICE> per service, so the
// tests reach whichever lane they run against without a hardcoded port.
const api = process.env.DEVLANES_PUBLIC_URL_API;
const web = process.env.DEVLANES_PUBLIC_URL_WEB;
if (!api || !web) {
  throw new Error("DEVLANES_PUBLIC_URL_API or DEVLANES_PUBLIC_URL_WEB is not set: run `devlanes with -- npm test`");
}

test("api answers through the proxy", async () => {
  const res = await fetch(`${api}/lane`);
  assert.equal(res.status, 200);
  const lane = await res.json();
  assert.equal(lane.project, "agent-hooks");
  assert.equal(lane.service, "api");
  assert.equal(lane.url, api);
});

test("api lists tasks", async () => {
  const tasks = await (await fetch(`${api}/api/tasks`)).json();
  assert.ok(tasks.length > 0);
});

test("web shows the api's tasks from the same lane", async () => {
  const res = await fetch(web);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /This is lane \d+ of/);
  assert.match(html, /Run the tests with devlanes with/);
});
