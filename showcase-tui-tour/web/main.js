import "./devlanes.css";

const env = import.meta.env;
const lane = Number(env.VITE_LANE);
const api = env.VITE_API_URL;
const $ = (id) => document.getElementById(id);

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const rows = (pairs) => pairs.map(([k, v, cls = ""]) => `<dt>${escape(k)}</dt><dd class="${cls}">${v}</dd>`).join("");
const link = (url) => `<a href="${escape(url)}">${escape(url)}</a>`;

document.body.style.setProperty("--dl-lane", `var(--dl-lane-${lane % 4})`);
document.title = `${env.VITE_PROJECT} lane ${lane}`;
$("title").textContent = `This is lane ${lane} of ${env.VITE_PROJECT}.`;
$("lede").innerHTML = `The <code>${escape(env.VITE_SERVICE)}</code> service (Vite) of the <code>${escape(env.VITE_LANE_LABEL)}</code> worktree. The orders below come from <code>api</code> in the same lane.`;
$("lane").innerHTML = rows([
  ["lane", `${lane} (${escape(env.VITE_LANE_NAME)})`],
  ["branch", escape(env.VITE_LANE_LABEL)],
  ["service", escape(env.VITE_SERVICE)],
  ["port", escape(env.VITE_PORT)],
  ["url", link(window.location.origin), "dl-url"],
  ["api", link(api)],
  ["mailpit", link(env.VITE_MAIL_URL)],
]);
$("inbox").href = env.VITE_MAIL_URL;
$("inbox").textContent = env.VITE_MAIL_URL.replace("https://", "");
$("footer").innerHTML = `<a href="${api}/api/orders">${escape(api)}/api/orders</a> | <a href="${api}/lane">/lane</a>`;

async function getJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function loadOrders() {
  try {
    const data = await getJson(`${api}/api/orders`);
    $("orders-title").textContent = `GET /api/orders · ${data.database}`;
    $("orders").innerHTML = rows([
      ["answered by", `lane ${data.lane}`, "dl-ok"],
      ...data.orders.map((o) => [`#${o.id}`, `${escape(o.item)}, $${(o.total_cents / 100).toFixed(2)} <span class="dl-key">${escape(o.customer)}</span>`]),
    ]);
  } catch (err) {
    $("orders").innerHTML = rows([["error", `${escape(err.message)} (is api running?)`, "dl-bad"]]);
  }
}

async function loadMail() {
  try {
    const data = await getJson(`${api}/api/mail`);
    $("mail-title").textContent = `GET /api/mail · redis db ${data.redis_db}`;
    $("mail").innerHTML = rows([
      ["lane:owner", escape(data.owner ?? "(unset)"), "dl-key"],
      ["waiting", `${data.queued} in mail:queue`, data.queued ? "dl-bad" : "dl-ok"],
      ...data.done.map((j) => [j.id, `sent to ${escape(j.to)} in ${j.took_ms}ms`, "dl-ok"]),
    ]);
  } catch (err) {
    $("mail").innerHTML = rows([["error", escape(err.message), "dl-bad"]]);
  }
}

$("send").addEventListener("submit", async (event) => {
  event.preventDefault();
  const to = new FormData(event.target).get("to");
  await getJson(`${api}/api/mail`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ to }),
  }).catch((err) => alert(err.message));
  await loadMail();
  // The worker sends it a moment later.
  setTimeout(loadMail, 1500);
});

loadOrders();
loadMail();
