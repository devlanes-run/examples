import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // brand/ is a link to _internal/brand; resolving it would put the CSS outside the app's root.
  resolve: { preserveSymlinks: true },
  // A Rust edit restarts the app, and Vite would reload the page for nothing.
  server: { watch: { ignored: ["**/src-tauri/**"] } },
  build: {
    rolldownOptions: {
      // second.html is the page of the window the "Open a second window" button opens.
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        second: resolve(import.meta.dirname, "second.html"),
      },
    },
  },
});
