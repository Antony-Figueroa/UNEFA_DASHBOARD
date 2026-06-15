import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    plugins: [
      react(),
      svgr(),
      nodePolyfills({
        include: ["buffer", "process", "util", "stream"],
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.png", "logo-nuevo.png"],
        manifest: {
          name: "SIGP UNEFA",
          short_name: "SIGP",
          description: "Sistema de Gestión Académica",
          theme_color: "#1e40af",
          background_color: "#f8fafc",
          display: "standalone",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB (react-pdf.browser.js is ~2.2 MB)
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/api\/.*/i,
              handler: "NetworkOnly",
              options: {
                precacheFallback: {
                  fallbackURL: "/",
                },
              },
            },
          ],
        },
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
