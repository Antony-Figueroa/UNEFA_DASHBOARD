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
      nodePolyfills({
        include: ["buffer", "process", "util", "stream"], // Limitar polyfills a lo esencial
      }),
    ],
    build: {
      chunkSizeWarningLimit: 1000, // Aumentar ligeramente el límite para el PDF que es pesado por naturaleza
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split React and core vendor libraries
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
                return "vendor-core";
              }
              if (id.includes("@react-pdf") || id.includes("pdfkit") || id.includes("fontkit")) {
                return "vendor-pdf";
              }
              if (id.includes("apexcharts") || id.includes("react-apexcharts")) {
                return "vendor-charts";
              }
              if (id.includes("lucide-react") || id.includes("icons")) {
                return "vendor-icons";
              }
              // Other node_modules go to a generic vendor chunk
              return "vendor";
            }
          },
        },
      },
    },
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
        .concat(['localhost', '127.0.0.1', '.railway.app', '.onrender.com'])
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
