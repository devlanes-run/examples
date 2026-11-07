import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Same-origin path to the API: the browser only talks to this page's host,
      // so no CORS is involved. API_PROXY_TARGET is the API's http://127.0.0.1 url.
      "/proxied": {
        target: process.env.API_PROXY_TARGET,
        rewrite: (path) => path.replace(/^\/proxied/, ""),
      },
    },
  },
});
