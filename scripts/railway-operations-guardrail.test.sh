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
grep -Fq "Opérations longues ou asynchrones" "$guardrail"
grep -Fq "Avant chaque étape mutante" "$guardrail"
grep -Fq "étapes déjà exécutées" "$guardrail"

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
target_guard_report=""
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
    local divergence_summary=""
    for divergence in "${divergences[@]}"; do
      if [[ -n "$divergence_summary" ]]; then
        divergence_summary+=", "
      fi
      divergence_summary+="$divergence"
    done

    target_guard_report="$(
      printf 'Cible diagnostiquée : projet=%s, environnement=%s, service=%s\n' \
        "$expected_project" "$expected_environment" "$expected_service"
      printf 'Cible reçue : projet=%s, environnement=%s, service=%s\n' \
        "$received_project" "$received_environment" "$received_service"
      printf 'Raison de l’arrêt : divergence de cible (%s); opération bloquée avant toute écriture.\n' \
        "$divergence_summary"
    )"
    printf '%s' "$target_guard_report"
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

multi_received_project="project-received"
multi_received_environment="environment-received"
multi_received_service="service-received"
multi_report=""
if multi_report="$(attempt_write \
  "$diagnosed_project" "$diagnosed_environment" "$diagnosed_service" \
  "$multi_received_project" "$multi_received_environment" "$multi_received_service")"; then
  echo "Multiple target divergences must block the Railway operation." >&2
  exit 1
fi

test ! -e "$write_marker"
grep -Fq "Cible diagnostiquée : projet=$diagnosed_project, environnement=$diagnosed_environment, service=$diagnosed_service" <<< "$multi_report"
grep -Fq "Cible reçue : projet=$multi_received_project, environnement=$multi_received_environment, service=$multi_received_service" <<< "$multi_report"
grep -Fq "Raison de l’arrêt : divergence de cible (projet, environnement, service); opération bloquée avant toute écriture." <<< "$multi_report"

current_project="$diagnosed_project"
current_environment="$diagnosed_environment"
current_service="$diagnosed_service"
target_reads=0
target_project_read=""
target_environment_read=""
target_service_read=""

read_current_target() {
  target_reads=$((target_reads + 1))
  target_project_read="$current_project"
  target_environment_read="$current_environment"
  target_service_read="$current_service"
}

guard_current_target() {
  local expected_project="$1"
  local expected_environment="$2"
  local expected_service="$3"
  local guard_status

  read_current_target
  if guard_target \
    "$expected_project" "$expected_environment" "$expected_service" \
    "$target_project_read" "$target_environment_read" "$target_service_read" \
    > /dev/null; then
    return 0
  else
    guard_status=$?
    return "$guard_status"
  fi
}

run_long_operation() {
  local expected_project="$1"
  local expected_environment="$2"
  local expected_service="$3"

  if guard_current_target \
    "$expected_project" "$expected_environment" "$expected_service"; then
    printf 'étape exécutée : préparer\n' >> "$write_marker"
  else
    printf 'étape bloquée : préparer; aucune écriture pour cette étape.\n%s\n' \
      "$target_guard_report"
    return 42
  fi

  # Simulate a target change while the operation is still in progress.
  current_service="service-changed-during-operation"

  if guard_current_target \
    "$expected_project" "$expected_environment" "$expected_service"; then
    printf 'étape exécutée : redéployer\n' >> "$write_marker"
  else
    printf 'étape bloquée : redéployer; aucune écriture pour cette étape.\n%s\n' \
      "$target_guard_report"
    return 42
  fi
}

rm -f "$write_marker"
target_reads=0
long_operation_report_file="$(mktemp)"
if run_long_operation \
  "$diagnosed_project" "$diagnosed_environment" "$diagnosed_service" \
  >"$long_operation_report_file"; then
  echo "A long Railway operation must stop when its target changes." >&2
  exit 1
fi
long_operation_report="$(<"$long_operation_report_file")"
rm -f "$long_operation_report_file"

test "$target_reads" -eq 2
grep -Fq "étape exécutée : préparer" "$write_marker"
if grep -Fq "étape exécutée : redéployer" "$write_marker"; then
  echo "A changed Railway target must block the next write." >&2
  exit 1
fi
grep -Fq "étape bloquée : redéployer; aucune écriture pour cette étape." \
  <<< "$long_operation_report"
grep -Fq "Cible diagnostiquée : projet=$diagnosed_project, environnement=$diagnosed_environment, service=$diagnosed_service" \
  <<< "$long_operation_report"
grep -Fq "Cible reçue : projet=$diagnosed_project, environnement=$diagnosed_environment, service=service-changed-during-operation" \
  <<< "$long_operation_report"
grep -Fq "Raison de l’arrêt : divergence de cible (service); opération bloquée avant toute écriture." \
  <<< "$long_operation_report"

echo "Railway operations guardrail check passed."
