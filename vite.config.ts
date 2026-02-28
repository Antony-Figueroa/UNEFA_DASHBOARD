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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              // Keep polyfills isolated so React core doesn't end up importing from vendor-misc
              // (Vite warns about circular chunks when that happens).
              if (
                /[\\/]node_modules[\\/](process|buffer|util|stream|events|inherits|readable-stream|string_decoder|safe-buffer|util-deprecate)[\\/]/.test(id)
              ) {
                return "vendor-node-polyfills";
              }

              // NOTE: Avoid extracting a separate React-core chunk here.
              // React (and the node polyfills it may reference) can easily create circular chunks with vendor-misc.
              // Keeping React core in the default vendor-misc chunk avoids Vite's circular chunk warning.
              if (/[\\/]node_modules[\\/]react-dom[\\/]/.test(id) || /[\\/]node_modules[\\/]scheduler[\\/]/.test(id)) {
                return "vendor-react-dom";
              }
              if (id.includes("react-router")) {
                return "vendor-router";
              }
              if (id.includes("@react-pdf") || id.includes("pdfkit") || id.includes("fontkit")) {
                return "vendor-pdf";
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
              if (id.includes("@tsparticles") || id.includes("tsparticles")) {
                return "vendor-particles";
              }
              if (id.includes("maplibre-gl")) {
                return "vendor-maplibre";
              }
              if (id.includes("@react-jvectormap")) {
                return "vendor-jvectormap";
              }
              if (id.includes("swiper")) {
                return "vendor-swiper";
              }
              if (id.includes("react-hook-form") || id.includes("@hookform")) {
                return "vendor-forms";
              }
              if (id.includes("axios")) {
                return "vendor-http";
              }
              if (id.includes("zod")) {
                return "vendor-validation";
              }
              if (id.includes("react-dropzone")) {
                return "vendor-dropzone";
              }
              if (id.includes("react-markdown") || id.includes("remark-gfm")) {
                return "vendor-markdown";
              }
              if (id.includes("flatpickr") || id.includes("react-flatpickr")) {
                return "vendor-datepicker";
              }
              if (id.includes("@supabase")) {
                return "vendor-supabase";
              }
              if (id.includes("clsx") || id.includes("tailwind-merge")) {
                return "vendor-utils";
              }
              return "vendor-misc";
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
