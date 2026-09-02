---
name: Railway Railpack builds
description: Railway may use Railpack defaults instead of the repository's Nixpacks configuration.
---

Railway can select Railpack automatically even when a nixpacks.toml file is present. For this project, deployment configuration must explicitly select the intended builder and pin compatible Node/npm versions so dependency installation remains reproducible.

**Why:** The automatic Railpack path selected Node 22 and ran npm install, which failed inside npm before the application build. The repository's existing Nixpacks install step was not applied.

**How to apply:** When diagnosing Railway build failures, keep `nodejs_22` and npm 10.8.2, force dev installs, and use `npm ci --include=dev --ignore-scripts` when Railway's npm hangs on native postinstall hooks.