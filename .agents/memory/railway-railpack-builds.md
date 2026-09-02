---
name: Railway Railpack builds
description: Railway may use Railpack defaults instead of the repository's Nixpacks configuration.
---

Railway can select Railpack automatically even when a nixpacks.toml file is present. For this project, deployment configuration must explicitly select the intended builder and pin compatible Node/npm versions so dependency installation remains reproducible.

**Why:** The automatic Railpack path selected Node 22 and ran npm install, which failed inside npm before the application build. The repository's existing Nixpacks install step was not applied.

**How to apply:** When diagnosing Railway build failures, inspect the actual builder and install command in the build log. Keep the Railway builder configuration explicit, use the Nixpkgs attribute `nodejs_22` (not Replit's `nodejs-20_x` spelling), set `NPM_CONFIG_PRODUCTION=false` for the build phase, pin Node/npm in package metadata, and prefer npm ci with the committed lockfile.