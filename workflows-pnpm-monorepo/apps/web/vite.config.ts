import { realpathSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig, searchForWorkspaceRoot } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // brand/ links to _internal/brand, outside this workspace. resolve.preserveSymlinks would
      // keep it inside, but it breaks resolving dependencies in pnpm's symlinked node_modules,
      // so the dev server may read the link's target instead.
      allow: [searchForWorkspaceRoot(process.cwd()), realpathSync("brand")],
    },
  },
});
