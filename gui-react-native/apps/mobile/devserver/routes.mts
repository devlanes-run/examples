import type { IncomingMessage, ServerResponse } from "node:http";
import { apiProxy } from "./apiProxy.mts";
import { laneInfo } from "./lane.mts";

type Handler = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

function healthz(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  if (req.method !== "GET") return next();
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("ok");
}

function lane(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  if (req.method !== "GET") return next();
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(laneInfo(req)));
}

/** Routes Metro serves before its own: the lane checks every example has, and the API. */
export const devServerRoutes: [string, Handler][] = [
  ["/healthz", healthz],
  ["/lane", lane],
  ["/api", apiProxy],
];
