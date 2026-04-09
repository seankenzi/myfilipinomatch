import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const createBuildVersionPlugin = (buildId: string): Plugin => ({
  name: "app-build-version",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "version.json",
      source: JSON.stringify(
        {
          buildId,
          generatedAt: buildId,
        },
        null,
        2
      ),
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const buildId = new Date().toISOString();

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      __APP_BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      react(),
      createBuildVersionPlugin(buildId),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": ["@radix-ui/react-accordion", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tooltip", "@radix-ui/react-popover"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-motion": ["framer-motion"],
            "vendor-query": ["@tanstack/react-query"],
          },
        },
      },
      target: "esnext",
      cssCodeSplit: true,
    },
  };
});
