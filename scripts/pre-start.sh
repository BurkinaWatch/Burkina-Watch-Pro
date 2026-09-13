#!/usr/bin/env bash
set -Eeuo pipefail

# Railway may invoke this wrapper from the service start command.
# Database schema changes are deliberately not run here: production migrations
# require a separate, explicitly authorized workflow.
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"

cd "$repo_root"
exec env SERVE_WEB=true node --enable-source-maps artifacts/api-server/dist/index.mjs