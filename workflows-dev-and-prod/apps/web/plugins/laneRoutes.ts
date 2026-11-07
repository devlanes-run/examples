import type { ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";
import { outDir, serverEnv, type ServerEnv } from "./env.ts";

/** `GET /lane`: the lane values every example returns. */
export type LaneInfo = {
  project: string;
  lane: number;
  lane_name: string;
  branch: string;
  service: string;
  port: number;
  url: string | null;
};

/** `GET /mode`: which Vite server answered, started by which script, under which profile. */
export type WebMode = {
  server: ServerName;
  script: string | null;
  node_env: string | null;
  profile: string | null;
  project_file: string;
  out_dir: string | null;
  api_url: string;
};

type ServerName = "vite dev server" | "vite preview";

function sendJson(res: ServerResponse, body: unknown) {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body, null, 2));
}

function laneInfo(env: ServerEnv, forwarded: string | undefined): LaneInfo {
  return {
    project: env.project,
    lane: env.lane,
    lane_name: env.laneName,
    branch: env.branch,
    service: env.service,
    port: env.port,
    // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
    url: forwarded ? `https://${forwarded}` : null,
  };
}

function webMode(env: ServerEnv, server: ServerName): WebMode {
  return {
    server,
    script: env.script,
    node_env: env.nodeEnv,
    profile: env.profile,
    project_file: env.projectFile,
    // The dev server compiles on request and reads no build output.
    out_dir: server === "vite preview" ? outDir : null,
    api_url: env.apiUrl,
  };
}

function routes(server: ServerName): Connect.NextHandleFunction {
  const env = serverEnv();
  return (req, res, next) => {
    const path = req.url?.split("?")[0];
    const forwarded = req.headers["x-forwarded-host"];
    if (path === "/healthz") {
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("ok");
    } else if (path === "/lane") {
      sendJson(res, laneInfo(env, typeof forwarded === "string" ? forwarded : undefined));
    } else if (path === "/mode") {
      sendJson(res, webMode(env, server));
    } else {
      next();
    }
  };
}

/**
 * Adds `/healthz`, `/lane` and `/mode` to `vite` and `vite preview` alike, so the page reports
 * the process that serves it, whichever script started it.
 */
export function laneRoutes(): Plugin {
  return {
    name: "lane-routes",
    configureServer(server) {
      server.middlewares.use(routes("vite dev server"));
    },
    configurePreviewServer(server) {
      server.middlewares.use(routes("vite preview"));
    },
  };
}
