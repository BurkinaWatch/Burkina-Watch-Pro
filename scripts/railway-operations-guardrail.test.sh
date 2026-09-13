#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"
guardrail="$repo_root/docs/RAILWAY_OPERATIONS_GUARDRAIL.md"

test -f "$guardrail"

required_sections=(
  "## Phase 1 — Diagnostic obligatoire en lecture seule"
  "## Phase 2 — Proposition obligatoire avant écriture"
  "## Point d'arrêt et confirmation explicite"
  "## Opérations toujours protégées"
  "## Rapport obligatoire"
  "### Actions exécutées"
  "### Actions proposées mais non exécutées"
)

for section in "${required_sections[@]}"; do
  grep -Fq "$section" "$guardrail" || {
    echo "Missing Railway guardrail section: $section" >&2
    exit 1
  }
done

grep -Fq "Projet" "$guardrail"
grep -Fq "Environnement" "$guardrail"
grep -Fq "Service" "$guardrail"
grep -Fq "Diff attendu" "$guardrail"
grep -Fq "Risques" "$guardrail"
grep -Fq "Retour arrière" "$guardrail"
grep -Fq "confirmation explicite" "$guardrail"
grep -Fq "push --force" "$guardrail"
grep -Fq "DATABASE_URL" "$guardrail"
grep -Fq "scripts/pre-start.sh" "$guardrail"

echo "Railway operations guardrail check passed."