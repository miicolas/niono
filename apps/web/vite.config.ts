import { defineConfig } from "vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
  plugins: [
    tailwindcss(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),

    tanstackStart(),
    viteReact(),
  ],
});

export default config;
