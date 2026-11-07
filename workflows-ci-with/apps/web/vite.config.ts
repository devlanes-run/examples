import { defineConfig } from "vite";

// Builds only the page's browser code; the Hono server renders the HTML and serves dist/client.
export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist/client",
    // Lanes started from one folder share dist/client; overwriting in place keeps the files there
    // while another lane rebuilds them.
    emptyOutDir: false,
    rolldownOptions: {
      input: "src/client/main.ts",
      output: {
        // A fixed name, so the server-rendered page can link it without reading a manifest.
        entryFileNames: "[name].js",
      },
    },
  },
});
