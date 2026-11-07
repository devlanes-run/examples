import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const outDir = process.env.WEB_OUT_DIR ?? "dist";

// /healthz, /lane and /mode answer from the server process, so the page reports
// how it is served right now, whichever script started it.
function laneRoutes(server) {
  return (req, res, next) => {
    const path = req.url.split("?")[0];
    const forwardedHost = req.headers["x-forwarded-host"];
    let body;
    if (path === "/healthz") {
      res.setHeader("content-type", "text/plain; charset=utf-8");
      return res.end("ok");
    } else if (path === "/lane") {
      body = {
        project: process.env.DEVLANES_LANE_PROJECT,
        lane: Number(process.env.DEVLANES_LANE),
        lane_name: process.env.DEVLANES_LANE_NAME,
        branch: process.env.LANE_LABEL,
        service: process.env.DEVLANES_SERVICE,
        port: Number(process.env.PORT),
        url: forwardedHost ? `https://${forwardedHost}` : `http://${req.headers.host}`,
      };
    } else if (path === "/mode") {
      body = {
        server,
        script: process.env.npm_lifecycle_event,
        node_env: process.env.NODE_ENV ?? null,
        profile: process.env.APP_PROFILE ?? null,
        project_file: process.env.PROJECT_FILE,
        out_dir: server === "vite preview" ? outDir : null,
        api_url: process.env.API_PUBLIC_URL,
      };
    } else {
      return next();
    }
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify(body, null, 2));
  };
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "lane-routes",
      configureServer: (s) => void s.middlewares.use(laneRoutes("vite dev server")),
      configurePreviewServer: (s) => void s.middlewares.use(laneRoutes("vite preview")),
    },
  ],
  build: {
    outDir,
    // WEB_OUT_DIR is outside the project, where Vite only empties it when told to.
    emptyOutDir: true,
  },
});
