#!/usr/bin/env bash
set -u

failures=0

check_required_command() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    printf 'OK %-16s %s\n' "$name" "$(command -v "$name")"
  else
    printf 'MISSING %-12s\n' "$name"
    failures=$((failures + 1))
  fi
}

printf '%s\n' 'GPU lab preflight (read-only; no installation)'
printf '%s\n' '================================================'

check_required_command nvidia-smi
check_required_command python3
check_required_command colmap

if command -v nvidia-smi >/dev/null 2>&1; then
  nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
else
  printf '%s\n' 'GPU details unavailable'
fi

if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
try:
    import torch
except Exception as exc:
    print(f"PyTorch unavailable: {exc}")
    raise SystemExit(1)

print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA runtime: {torch.version.cuda}")
if not torch.cuda.is_available():
    raise SystemExit(1)

tensor = torch.ones((2, 2), device="cuda")
print(f"CUDA tensor device: {tensor.device}")
print(f"CUDA tensor checksum: {float(tensor.sum().item())}")
PY
  if [ "$?" -ne 0 ]; then
    failures=$((failures + 1))
  fi
fi

if command -v colmap >/dev/null 2>&1; then
  colmap --help >/dev/null 2>&1
  if [ "$?" -eq 0 ]; then
    printf '%s\n' 'COLMAP help: OK'
  else
    printf '%s\n' 'COLMAP help: FAILED'
    failures=$((failures + 1))
  fi
fi

if [ "$failures" -eq 0 ]; then
  printf '%s\n' 'PRECHECK PASS'
else
  printf 'PRECHECK FAIL (%s missing or failing checks)\n' "$failures"
  exit 1
fi