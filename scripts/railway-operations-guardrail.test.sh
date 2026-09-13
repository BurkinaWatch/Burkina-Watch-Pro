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

diagnosed_project="project-diagnostic"
diagnosed_environment="environment-diagnostic"
diagnosed_service="service-diagnostic"
write_marker="$(mktemp)"
rm -f "$write_marker"
cleanup() {
  rm -f "$write_marker"
}
trap cleanup EXIT

guard_target() {
  local expected_project="$1"
  local expected_environment="$2"
  local expected_service="$3"
  local received_project="$4"
  local received_environment="$5"
  local received_service="$6"
  local divergences=()

  [[ "$expected_project" == "$received_project" ]] || divergences+=("projet")
  [[ "$expected_environment" == "$received_environment" ]] || divergences+=("environnement")
  [[ "$expected_service" == "$received_service" ]] || divergences+=("service")

  if ((${#divergences[@]} > 0)); then
    printf 'Cible diagnostiquée : projet=%s, environnement=%s, service=%s\n' \
      "$expected_project" "$expected_environment" "$expected_service"
    printf 'Cible reçue : projet=%s, environnement=%s, service=%s\n' \
      "$received_project" "$received_environment" "$received_service"
    printf 'Raison de l’arrêt : divergence de cible (%s); opération bloquée avant toute écriture.\n' \
      "$(IFS=', '; echo "${divergences[*]}")"
    return 42
  fi
}

attempt_write() {
  guard_target "$@" || return
  printf 'mutation autorisée\n' > "$write_marker"
}

if ! attempt_write \
  "$diagnosed_project" "$diagnosed_environment" "$diagnosed_service" \
  "$diagnosed_project" "$diagnosed_environment" "$diagnosed_service"; then
  echo "The matching Railway target must pass the guard." >&2
  exit 1
fi
test -f "$write_marker"
rm -f "$write_marker"

divergence_cases=(
  "projet project-received $diagnosed_environment $diagnosed_service"
  "environnement $diagnosed_project environment-received $diagnosed_service"
  "service $diagnosed_project $diagnosed_environment service-received"
)

for case in "${divergence_cases[@]}"; do
  read -r divergence received_project received_environment received_service <<< "$case"
  report=""
  if report="$(attempt_write \
    "$diagnosed_project" "$diagnosed_environment" "$diagnosed_service" \
    "$received_project" "$received_environment" "$received_service")"; then
    echo "A $divergence divergence must block the Railway operation." >&2
    exit 1
  fi

  test ! -e "$write_marker"
  grep -Fq "Cible diagnostiquée : projet=$diagnosed_project, environnement=$diagnosed_environment, service=$diagnosed_service" <<< "$report"
  grep -Fq "Cible reçue : projet=$received_project, environnement=$received_environment, service=$received_service" <<< "$report"
  grep -Fq "Raison de l’arrêt : divergence de cible ($divergence); opération bloquée avant toute écriture." <<< "$report"
done

echo "Railway operations guardrail check passed."
