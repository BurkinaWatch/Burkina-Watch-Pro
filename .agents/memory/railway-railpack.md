---
name: Railway Railpack runtime pinning
description: Railway Railpack may ignore the local Nixpacks Node version and select a newer runtime, causing npm installation failures.
---

Railway builds should pin the Node and npm versions in project metadata rather than relying only on `nixpacks.toml`.

**Why:** Railpack selected Node 22/npm 10.9 during a build even though the project configuration targeted Node 20; the automatic npm install then failed with `Exit handler never called!`, while the same dependency tree installed successfully under Node 20/npm 10.8.

**How to apply:** Keep the Node/npm engine and package-manager declarations aligned with the tested local runtime, and retain a matching `.nvmrc` when Railway uses Railpack.