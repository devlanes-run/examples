// A throwaway server that logs each request, the kind of one-off process an
// agent starts while debugging. It is not in devlanes.yaml: run it with
// `devlanes exec --name scratch -- node scratch.mjs 8787`.
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 8787);

createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("ok\n");
}).listen(port, "127.0.0.1", () => {
  console.log(`scratch listening on http://127.0.0.1:${port}`);
  // devlanes exec gives every unit the lane's URLs, as devlanes with does.
  console.log(`lane api: ${process.env.DEVLANES_PUBLIC_URL_API}`);
});
