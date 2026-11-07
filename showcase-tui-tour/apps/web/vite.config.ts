import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // brand/ is a link to _internal/brand; resolving it would put the CSS outside the app's root.
  resolve: { preserveSymlinks: true },
});
