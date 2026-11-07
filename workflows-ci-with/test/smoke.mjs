// A quick check for `devlanes exec --name smoke -- node test/smoke.mjs` against
// a running lane. Exits 1 when a service does not answer /healthz.
const targets = {
  api: process.env.DEVLANES_PUBLIC_URL_API,
  web: process.env.DEVLANES_PUBLIC_URL_WEB,
};

let failed = false;
for (const [service, url] of Object.entries(targets)) {
  try {
    const res = await fetch(`${url}/healthz`);
    console.log(`${service} ${url}/healthz ${res.status} ${await res.text()}`);
    if (!res.ok) failed = true;
  } catch (err) {
    console.log(`${service} ${url}/healthz failed: ${err.cause?.message ?? err.message}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
