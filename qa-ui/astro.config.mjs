import { defineConfig } from "astro/config";
import node from '@astrojs/node';
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [svelte(), tailwind()],
  server: {
    port: 3000,
    host: true
  },
  output: 'server',
  adapter: node({
    mode: 'standalone',
  })
});