import { defineConfig } from "vitest/config";
import { transform } from "esbuild";
import path from "path";

function tsxTransform() {
  return {
    name: "tsx-transform",
    enforce: "pre" as const,
    async transform(code: string, id: string) {
      if (!/\.[jt]sx$/.test(id) || id.includes("node_modules")) {
        return;
      }

      const result = await transform(code, {
        loader: id.endsWith(".tsx") ? "tsx" : "jsx",
        format: "esm",
        jsx: "automatic",
        sourcemap: "inline",
        sourcefile: id,
      });

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}

export default defineConfig({
  plugins: [tsxTransform()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./client/src/test/setup.ts"],
    include: [
      "client/src/**/*.test.{ts,tsx}",
      "server/notificationRoutes.test.{ts,tsx}",
    ],
    restoreMocks: true,
    clearMocks: true,
  },
});