---
name: Railway Railpack runtime pinning
description: Railway Railpack may ignore the local Nixpacks Node version and select a newer runtime, causing npm installation failures.
---

Railway builds should pin the Node and npm versions in project metadata rather than relying only on `nixpacks.toml`, and must not set `NODE_ENV=production` globally during the build.

**Why:** Railpack selected Node 22/npm 10.9 during a build even though the project configuration targeted Node 20; the automatic npm install then failed with `Exit handler never called!`, while the same dependency tree installed successfully under Node 20/npm 10.8. A production `NODE_ENV` also omits the dev-only Vite build toolchain and makes `npm run build` fail with exit code 127.

**How to apply:** Keep the Node/npm engine and package-manager declarations aligned with the tested local runtime, retain a matching `.nvmrc`, set production mode in the start command rather than globally, and classify every package needed by the production build as a runtime dependency when Railpack omits devDependencies.