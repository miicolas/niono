import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({ srcDirectory: "." }),
    nitro(),
    viteReact(),
  ],
  resolve: { tsconfigPaths: true, dedupe: ["react", "react-dom"] },
  server: { port: 3000 },
});
