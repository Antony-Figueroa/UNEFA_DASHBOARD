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
        include: ["buffer", "process", "util", "stream"],
      }),
    ],
    build: {
      chunkSizeWarningLimit: 600,
      // Disable manualChunks to prevent React 19 compatibility issues
      // The automatic chunking is more stable
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Only create custom chunks for large, stable libraries
            // Let React and other core libs be bundled together
            if (id.includes("node_modules")) {
              if (id.includes("@supabase")) {
                return "vendor-supabase";
              }
              if (id.includes("apexcharts") || id.includes("react-apexcharts")) {
                return "vendor-charts";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              if (id.includes("motion") || id.includes("framer-motion")) {
                return "vendor-motion";
              }
              if (id.includes("@fullcalendar")) {
                return "vendor-calendar";
              }
              if (id.includes("axios")) {
                return "vendor-http";
              }
              if (id.includes("zod")) {
                return "vendor-validation";
              }
              if (id.includes("react-hook-form") || id.includes("@hookform")) {
                return "vendor-forms";
              }
              if (id.includes("flatpickr") || id.includes("react-flatpickr")) {
                return "vendor-datepicker";
              }
              // Keep React bundled together by default - fixes "Cannot set properties of undefined" error
              return;
            }
          },
        },
      },
    },
    define: {
      // Ensure process.env is defined for React 19
      'process.env': '{}',
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
      host: true,
      port: Number(process.env.PORT) || 5173,
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
