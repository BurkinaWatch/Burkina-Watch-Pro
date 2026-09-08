---
name: Railway Railpack runtime pinning
description: Railway Railpack may ignore the local Nixpacks Node version and select a newer runtime, causing npm installation failures.
---

Railway builds should pin the Node and npm versions in project metadata rather than relying only on `nixpacks.toml`, and must not set `NODE_ENV=production` globally during the build.

**Why:** Railpack selected Node 22/npm 10.9 during a build even though the project configuration targeted Node 20; the automatic npm install then failed with `Exit handler never called!`, while the same dependency tree installed successfully under Node 20/npm 10.8. A production `NODE_ENV` also omits the dev-only Vite build toolchain and makes `npm run build` fail with exit code 127.

**How to apply:** Keep the Node/npm engine and package-manager declarations aligned with the tested local runtime, retain a matching `.nvmrc`, set production mode in the start command rather than globally, and classify every package needed by the production build as a runtime dependency when Railpack omits devDependencies.

Railpack can still emit `npm warn config production` while its plan says `npm ci --include=dev`; the warning alone does not prove that devDependencies were omitted because `--include=dev` wins in npm 10.8.2.

**Why:** A Railway build with Node 20.20.0/npm 10.8.2 ran `npm ci --include=dev --legacy-peer-deps` for over eight minutes, printed `Exit handler never called!`, and still advanced to a build with no Vite executable. The same tree completed with `npm install --include=dev --legacy-peer-deps` and built successfully, even with production mode enabled.

**How to apply:** Use Railpack's `RAILPACK_NODE_NPM_INSTALL` configuration variable to select `npm install --include=dev --legacy-peer-deps`; keep the build command as `npm run build`. Do not add a manual `node_modules` cleanup step because a mounted Vite cache can return `EBUSY`.

Railpack 0.39 also runs `npm i -g corepack@latest` before activating the pinned npm; with Node 20 this can emit an `EBADENGINE` warning for a newer Corepack while still exiting successfully.

**Why:** The warning is noisy but the build continued with npm 10.8.2; the reproducible failure remained the later `npm ci` step.

**How to apply:** Treat this as a Railpack compatibility warning, not a reason to upgrade the application's Node runtime unless the command begins failing nonzero.