import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      svgr(),
      nodePolyfills(),
    ],
    optimizeDeps: {
      include: ["@react-pdf/renderer"],
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
    },
    server: {
      // Direct connection to Backend API
      host: true,
      port: Number(process.env.PORT) || 5173,
      // Allow specific hosts via env var ALLOWED_HOSTS (comma separated)
      // Example: ALLOWED_HOSTS=unefadashboard-production.up.railway.app
      allowedHosts: (process.env.ALLOWED_HOSTS || '')
        .split(',')
        .map(h => h.trim())
        .filter(Boolean)
        .concat(['localhost', '127.0.0.1', '.railway.app', '.onrender.com']),
      proxy: {
        '/n8n-proxy': {
          target: 'https://antonysamuel0903.app.n8n.cloud',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/n8n-proxy/, ''),
        },
      },
    },
    preview: {
      host: true,
      port: Number(process.env.PORT) || 3000,
      allowedHosts: (process.env.ALLOWED_HOSTS || '')
        .split(',')
        .map(h => h.trim())
        .filter(Boolean)
        .concat(['localhost', '127.0.0.1', '.railway.app', '.onrender.com'])
    },
  };
});
