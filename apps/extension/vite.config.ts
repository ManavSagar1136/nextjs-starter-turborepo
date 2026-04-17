import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify(env.VITE_API_URL || "http://localhost:3101"),
      "import.meta.env.VITE_DASHBOARD_ROUTE": JSON.stringify(env.VITE_DASHBOARD_ROUTE || "/dashboard"),
    },
    publicDir: "public",
    build: {
      outDir: "dist",
      emptyOutDir: true,
      target: "chrome110",
      sourcemap: mode === "development",
      minify: mode !== "development",
      rollupOptions: {
        input: {
          popup: resolve(__dirname, "popup.html"),
          background: resolve(__dirname, "src/background/service-worker.ts"),
          content: resolve(__dirname, "src/content/index.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },
  };
});
