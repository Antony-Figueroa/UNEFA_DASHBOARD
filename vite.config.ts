import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          // This will transform your SVG to a React component
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
    ],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
