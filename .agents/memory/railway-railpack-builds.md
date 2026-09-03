---
name: Railway Railpack builds
description: Railway may use Railpack defaults instead of the repository's Nixpacks configuration.
---

Railway can select Railpack automatically even when a nixpacks.toml file is present. For this project, deployment configuration must explicitly select the intended builder and pin compatible Node/npm versions so dependency installation remains reproducible.

**Why:** The automatic Railpack path selected Node 22 and ran npm install, which failed inside npm before the application build. The repository's existing Nixpacks install step was not applied.

**How to apply:** Keep Node 22/npm 10.8.2, put build-time tools in production dependencies, keep test-only tools in devDependencies, and deploy with `npm ci --omit=dev --ignore-scripts --no-audit --no-fund`.