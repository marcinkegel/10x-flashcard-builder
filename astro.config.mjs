// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import { polyfillPlugin } from "./polyfill-plugin.mjs";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss(), polyfillPlugin()],
    ssr: {
      external: ["node:async_hooks"],
      noExternal: ["react", "react-dom"],
    },
    resolve: {
      alias: {
        // Use browser-compatible React DOM server for Cloudflare Workers
        "react-dom/server": "react-dom/server.browser",
      },
    },
  },
  adapter: cloudflare({
    imageService: "compile",
    runtime: {
      mode: "off",
      type: "pages",
    },
  }),
});
