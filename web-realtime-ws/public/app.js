const $ = (id) => document.getElementById(id);
const log = $("log");

function setState(el, text, ok) {
  el.textContent = text;
  el.className = ok ? "dl-ok" : "dl-bad";
}

function print(line) {
  log.textContent = `${line}\n${log.textContent}`;
}

// Server-Sent Events. A frozen lane sends no ticks, so the age keeps growing until the lane thaws.
let lastTick = 0;
const events = new EventSource("/events");
events.onopen = () => setState($("sse-state"), "open", true);
events.onerror = () => setState($("sse-state"), "reconnecting", false);
events.onmessage = (event) => {
  const { lane, tick, time } = JSON.parse(event.data);
  lastTick = Date.now();
  $("sse-tick").textContent = `#${tick} from lane ${lane} at ${time.slice(11, 19)}`;
};
setInterval(() => {
  if (!lastTick) return;
  const age = Math.round((Date.now() - lastTick) / 1000);
  setState($("sse-age"), age < 3 ? "just now" : `${age}s ago, no tick since`, age < 3);
}, 500);

// Two WebSockets: one to the ws port's own hostname, one to /ws on this page's hostname.
// location.host keeps the proxy's port when it fell back to 8443.
const urls = { ws: `wss://ws.${location.host}`, default: `wss://${location.host}/ws` };
const sockets = {};
const pending = new Map();

function connect(name) {
  const socket = new WebSocket(urls[name]);
  sockets[name] = socket;
  socket.onopen = () => setState($(`state-${name}`), `open: ${urls[name]}`, true);
  socket.onclose = () => {
    setState($(`state-${name}`), `closed: ${urls[name]}, retrying`, false);
    setTimeout(() => connect(name), 2000);
  };
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "hello") return;
    const sent = pending.get(msg.id);
    pending.delete(msg.id);
    const trip = sent ? ` (round trip ${Date.now() - sent} ms)` : "";
    print(`lane ${msg.lane} via ${msg.via}, port ${msg.port_name}: ${msg.text}${trip}`);
  };
}
connect("ws");
connect("default");

$("chat").addEventListener("submit", (event) => {
  event.preventDefault();
  const text = $("text").value.trim();
  const socket = sockets[$("via").value];
  if (!text || socket.readyState !== WebSocket.OPEN) return;
  const id = crypto.randomUUID();
  pending.set(id, Date.now());
  socket.send(JSON.stringify({ id, text }));
  $("text").value = "";
});
