// Run with `devlanes exec --name load -- npm run load`: an ad-hoc unit that asks
// api for the orders once a second until you stop it. The npm script passes
// --use-system-ca because devlanes 0.11.3 gives exec units no
// NODE_EXTRA_CA_CERTS; `devlanes setup` put the devlanes CA in the system store.
const url = `${process.env.DEVLANES_PUBLIC_URL_API}/api/orders`;
const clock = () => new Date().toTimeString().slice(0, 8);

console.log(`GET ${url} once a second`);
setInterval(async () => {
  const started = performance.now();
  try {
    const res = await fetch(url);
    const body = await res.json();
    const ms = Math.round(performance.now() - started);
    console.log(
      `${clock()} ${res.status} ${body.orders.length} orders from lane ${body.lane} in ${ms}ms`,
    );
  } catch (err) {
    console.log(`${clock()} ${err.cause?.code ?? err.message}`);
  }
}, 1_000);
