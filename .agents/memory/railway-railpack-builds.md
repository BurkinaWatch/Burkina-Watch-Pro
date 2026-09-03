---
name: Railway Railpack builds
description: Railway may use Railpack defaults instead of the repository's Nixpacks configuration.
---

Railway can ignore or stale-cache Nixpacks instructions even when a nixpacks.toml file is present. For this project, deployment configuration must explicitly select the Dockerfile builder and pin compatible Node/npm versions so dependency installation remains reproducible. npm 10.8.2 is unsafe here because Railway observed its internal "Exit handler never called!" crash; use npm 10.9.x, currently pinned to 10.9.9.

**Why:** The automatic Railpack path selected Node 22 and ran npm install, which failed inside npm before the application build. Railway's diagnostic identified the npm 10.8.2 crash as the cause of the incomplete install and later "vite: not found" error.

**How to apply:** Use the explicit Dockerfile builder rather than relying on Nixpacks autodetection. Keep Node 22/npm 10.9.x, put build-time tools in production dependencies, keep test-only tools in devDependencies, and run `npm ci --omit=dev --ignore-scripts --no-audit --no-fund` before the production build.