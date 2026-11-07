// Sends one message to the lane's chat through the proxy and prints the echo.
// Run it with `devlanes exec`, which passes DEVLANES_PUBLIC_URL_REALTIME and DEVLANES_CA_CERT.
import { readFileSync } from 'node:fs';
import { WebSocket } from 'ws';

const { DEVLANES_PUBLIC_URL_REALTIME: base, DEVLANES_CA_CERT: caFile } = process.env;
if (!base) {
  console.error('DEVLANES_PUBLIC_URL_REALTIME is not set; run: devlanes exec --name chat -- node chat.mjs <text>');
  process.exit(1);
}
const url = base.replace(/^https:\/\//, 'wss://ws.');
const text = process.argv.slice(2).join(' ') || 'hello from the terminal';
const id = String(Date.now());

// An exec unit gets no NODE_EXTRA_CA_CERTS, so trust the devlanes CA explicitly.
const socket = new WebSocket(url, { ca: caFile ? readFileSync(caFile) : undefined });
const timer = setTimeout(() => {
  console.error(`no echo from ${url} after 15s`);
  process.exit(1);
}, 15000);

socket.on('error', (error) => {
  console.error(`${url}: ${error.message}`);
  process.exit(1);
});
socket.on('open', () => socket.send(JSON.stringify({ id, text })));
socket.on('message', (data) => {
  const msg = JSON.parse(String(data));
  if (msg.id !== id) return;
  console.log(`lane ${msg.lane} (${msg.lane_name}) via ${msg.via}, port ${msg.port_name}: ${msg.text}`);
  clearTimeout(timer);
  socket.close();
});
