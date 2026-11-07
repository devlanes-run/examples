import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { outDir } from "./plugins/env.ts";
import { laneRoutes } from "./plugins/laneRoutes.ts";

export default defineConfig({
  plugins: [react(), laneRoutes()],
  // brand/ is a link to _internal/brand; resolving it would put the CSS outside the app's root.
  resolve: { preserveSymlinks: true },
  build: {
    outDir,
    // WEB_OUT_DIR is outside the app, where Vite only empties it when told to.
    emptyOutDir: true,
  },
});
