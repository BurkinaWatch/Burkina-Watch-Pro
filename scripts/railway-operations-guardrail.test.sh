#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"
guardrail="$repo_root/docs/RAILWAY_OPERATIONS_GUARDRAIL.md"
railway_config="$repo_root/railway.json"
start_wrapper="$repo_root/scripts/pre-start.sh"

test -f "$guardrail"
test -f "$railway_config"
test -f "$start_wrapper"

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

if grep -Eq '(^|[[:space:]])(db[[:space:]]+push|drizzle-kit[[:space:]]+push|migrate)([[:space:]]|$)' "$start_wrapper"; then
  echo "The Railway start wrapper must not run database mutations." >&2
  exit 1
fi

if grep -Eq '(^|[[:space:]])(db[[:space:]]+push|drizzle-kit[[:space:]]+push|migrate)([[:space:]]|$)' "$railway_config"; then
  echo "The Railway build/start configuration must not run database mutations." >&2
  exit 1
fi

echo "Railway operations guardrail check passed."