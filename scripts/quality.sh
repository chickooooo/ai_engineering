#!/usr/bin/env bash
#
# Runs every quality check on both sides, then prints one summary.
#
# Unlike plain `make`, a failing step does not stop the run: everything is
# checked, so one pass tells you the whole story.

set -uo pipefail

MAKE_CMD=${MAKE:-make}

if [ -t 1 ]; then
  BOLD=$'\033[1m'
  DIM=$'\033[2m'
  RED=$'\033[31m'
  GREEN=$'\033[32m'
  RESET=$'\033[0m'
else
  BOLD='' DIM='' RED='' GREEN='' RESET=''
fi

RULE='────────────────────────────────────────────────────────────'

# "side target label"
STEPS=(
  "backend backend-lint lint"
  "backend backend-types types"
  "backend backend-test tests"
  "frontend frontend-lint lint"
  "frontend frontend-types types"
  "frontend frontend-test tests"
)

results=()
failed=0
current_side=''

heading() {
  printf '\n%s%s%s\n' "$DIM" "$RULE" "$RESET"
  printf '%s  %s%s\n' "$BOLD" "$1" "$RESET"
  printf '%s%s%s\n\n' "$DIM" "$RULE" "$RESET"
}

for step in "${STEPS[@]}"; do
  # shellcheck disable=SC2086
  set -- $step
  side=$1 target=$2 label=$3

  if [ "$side" != "$current_side" ]; then
    heading "$(echo "$side" | tr '[:lower:]' '[:upper:]')"
    current_side=$side
  fi

  printf '%s▸ %s%s\n' "$BOLD" "$label" "$RESET"

  started=$(date +%s)
  "$MAKE_CMD" --no-print-directory "$target"
  status=$?
  elapsed=$(($(date +%s) - started))

  if [ $status -eq 0 ]; then
    results+=("$side $label ok $elapsed")
  else
    results+=("$side $label fail $elapsed")
    failed=$((failed + 1))
  fi

  printf '\n'
done

heading 'SUMMARY'

for result in "${results[@]}"; do
  # shellcheck disable=SC2086
  set -- $result
  side=$1 label=$2 status=$3 elapsed=$4

  if [ "$status" = ok ]; then
    mark="${GREEN}✓${RESET}"
  else
    mark="${RED}✗${RESET}"
  fi

  printf '  %b  %-9s %-6s %s%ss%s\n' "$mark" "$side" "$label" "$DIM" "$elapsed" "$RESET"
done

printf '\n'

if [ $failed -eq 0 ]; then
  printf '  %sAll %d checks passed%s\n\n' "$GREEN" "${#results[@]}" "$RESET"
  exit 0
fi

printf '  %s%d of %d checks failed%s\n\n' "$RED" "$failed" "${#results[@]}" "$RESET"
exit 1
