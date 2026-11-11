import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRequire = createRequire(
  path.join(rootDir, "artifacts/burkinawatch/package.json"),
);
const viteRequire = createRequire(appRequire.resolve("vite/package.json"));
const { build } = viteRequire("esbuild");
const React = appRequire("react");
const { renderToStaticMarkup } = appRequire("react-dom/server");

const virtualModules = {
  "@/hooks/useAuth": `
    export function useAuth() {
      return globalThis.__BW_TEST_AUTH_STATE__;
    }
  `,
  "wouter": `
    import React from "react";
    export function Link({ href, children, ...props }) {
      return React.createElement("a", { href, ...props }, children);
    }
  `,
  "@/components/ui/button": `
    import React from "react";
    export function Button({ children, ...props }) {
      return React.createElement("button", props, children);
    }
  `,
  "lucide-react": `
    import React from "react";
    const Icon = () => React.createElement("span");
    export const Shield = Icon;
    export const UserPlus = Icon;
    export const Lock = Icon;
    export const ArrowRight = Icon;
    export const Sparkles = Icon;
    export const Clock = Icon;
    export const CheckCircle2 = Icon;
  `,
  "@/components/Header": `export default function Header() { return null; }`,
  "@/components/BottomNav": `export default function BottomNav() { return null; }`,
};

const mockModules = {
  name: "burkinawatch-auth-test-mocks",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^react(?:\/.*)?$/ }, ({ path: importPath }) => ({
      path: importPath,
      external: true,
    }));

    buildApi.onResolve({ filter: /.*/ }, ({ path: importPath }) => {
      if (Object.hasOwn(virtualModules, importPath)) {
        return { path: importPath, namespace: "burkinawatch-test" };
      }
      return undefined;
    });

    buildApi.onLoad(
      { filter: /.*/, namespace: "burkinawatch-test" },
      ({ path: modulePath }) => ({
        contents: virtualModules[modulePath],
        loader: "js",
      }),
    );
  },
};

const bundle = await build({
  entryPoints: [
    path.join(rootDir, "artifacts/burkinawatch/src/components/AuthGuard.tsx"),
  ],
  bundle: true,
  format: "cjs",
  platform: "node",
  jsx: "automatic",
  packages: "external",
  write: false,
  plugins: [mockModules],
});

const testModule = { exports: {} };
const bundleRequire = createRequire(
  path.join(rootDir, "artifacts/burkinawatch/src/components/AuthGuard.tsx"),
);
new Function("require", "module", "exports", bundle.outputFiles[0].text)(
  bundleRequire,
  testModule,
  testModule.exports,
);

const AuthGuard = testModule.exports.default;
const protectedContent = React.createElement(
  "main",
  { "data-testid": "urgences-content" },
  "Numéros et services d’urgence",
);

globalThis.__BW_TEST_AUTH_STATE__ = {
  isAuthenticated: false,
  isLoading: true,
};
const loadingMarkup = renderToStaticMarkup(
  React.createElement(AuthGuard, { children: protectedContent }),
);
assert.match(loadingMarkup, /data-testid="loading-auth"/);
assert.doesNotMatch(loadingMarkup, /urgences-content/);

globalThis.__BW_TEST_AUTH_STATE__ = {
  isAuthenticated: false,
  isLoading: false,
};
const signedOutMarkup = renderToStaticMarkup(
  React.createElement(AuthGuard, { children: protectedContent }),
);
assert.match(signedOutMarkup, /Contenu réservé aux membres/);
assert.match(signedOutMarkup, /href="\/connexion"/);
assert.doesNotMatch(signedOutMarkup, /urgences-content/);

globalThis.__BW_TEST_AUTH_STATE__ = {
  isAuthenticated: true,
  isLoading: false,
};
const signedInMarkup = renderToStaticMarkup(
  React.createElement(AuthGuard, { children: protectedContent }),
);
assert.match(signedInMarkup, /urgences-content/);
assert.match(signedInMarkup, /Numéros et services d’urgence/);
assert.doesNotMatch(signedInMarkup, /Contenu réservé aux membres/);

const appSource = await readFile(
  path.join(rootDir, "artifacts/burkinawatch/src/App.tsx"),
  "utf8",
);
const normalizedAppSource = appSource.replace(/\s+/g, " ");
assert.ok(
  normalizedAppSource.includes(
    '<Route path="/urgences">{() => <AuthGuard><Urgences /></AuthGuard>}</Route>',
  ),
  "the /urgences route must keep the AuthGuard around the Urgences page",
);

delete globalThis.__BW_TEST_AUTH_STATE__;
console.log(
  "Urgences auth tests passed: loading, signed-out prompt, signed-in content, and protected route wiring.",
);
