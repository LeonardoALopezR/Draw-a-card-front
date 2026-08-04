#!/usr/bin/env bash
# init.sh — one-shot local environment setup + verification for draw-a-card-front.
#
# Installs deps, type-checks, runs expo-doctor's config/dependency health check, runs the
# test suite (if one is configured), and does a web build smoke check (npx expo export).
# Safe to re-run: each stage is idempotent.
#
# Usage: ./init.sh [--skip-doctor] [--skip-tests] [--skip-build]
# Exit code: 0 if every stage passed (warnings allowed), 1 if any stage failed.
#
# Written for bash 3.2 (macOS's default /bin/bash) — no arrays with negative indices, no
# associative arrays, no `${var,,}`.
#
# Note: this app talks to the Draw-a-card backend (Constitution Principle II/VIII) — this
# script does NOT start or check that backend. Run its own `./init.sh` separately if you need
# the API up too; the checks here (install/type-check/build) don't require it.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# Pick up this project's pinned Node version (.nvmrc) even when invoked from a fresh shell
# that never sourced nvm itself (e.g. the Stop hook, or an agent's Bash call).
if [ -f .nvmrc ] && [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]; then
  # shellcheck disable=SC1090
  \. "${NVM_DIR:-$HOME/.nvm}/nvm.sh" --no-use
  nvm use --silent >/dev/null 2>&1 || true
fi

REQUIRED_NODE_MAJOR=20

SKIP_DOCTOR=false
SKIP_TESTS=false
SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --skip-doctor) SKIP_DOCTOR=true ;;
    --skip-tests) SKIP_TESTS=true ;;
    --skip-build) SKIP_BUILD=true ;;
    -h|--help)
      echo "Usage: ./init.sh [--skip-doctor] [--skip-tests] [--skip-build]"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 2
      ;;
  esac
done

STEPS_TOTAL=0
STEPS_FAIL=0
SUMMARY=""

log() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }

# add_result NAME STATUS(OK|WARN|FAIL) DETAIL
add_result() {
  STEPS_TOTAL=$((STEPS_TOTAL + 1))
  icon="✅"
  if [ "$2" = "WARN" ]; then icon="⚠️ "; fi
  if [ "$2" = "FAIL" ]; then icon="❌"; STEPS_FAIL=$((STEPS_FAIL + 1)); fi
  SUMMARY="${SUMMARY}${icon} [$2] ${1}: ${3}
"
  printf '%s [%s] %s: %s\n' "$icon" "$2" "$1" "$3"
}

print_summary_and_exit() {
  printf '\n==================== init.sh summary ====================\n'
  printf '%s' "$SUMMARY"
  printf '===========================================================\n'
  if [ "$STEPS_FAIL" -gt 0 ]; then
    printf 'RESULT: FAILED (%d/%d stages failed)\n' "$STEPS_FAIL" "$STEPS_TOTAL"
    exit 1
  fi
  printf 'RESULT: SUCCESS (%d/%d stages passed)\n' "$STEPS_TOTAL" "$STEPS_TOTAL"
  exit 0
}

# ---------------------------------------------------------------------------
log "1/6 Checking prerequisites"
missing=""
for bin in node npm; do
  command -v "$bin" >/dev/null 2>&1 || missing="${missing}${bin} "
done

if [ -n "$missing" ]; then
  add_result "Prerequisites" "FAIL" "missing on PATH: $missing"
  print_summary_and_exit
fi

node_major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
if [ "$node_major" -lt "$REQUIRED_NODE_MAJOR" ]; then
  add_result "Prerequisites" "FAIL" "node $(node -v) found — this project pins v${REQUIRED_NODE_MAJOR} via .nvmrc (Expo 51 itself only needs >=18.18, but we standardize on 20 to match the backend repo) — run 'nvm use' and re-run"
  print_summary_and_exit
fi
add_result "Prerequisites" "OK" "node $(node -v), npm v$(npm -v)"

# ---------------------------------------------------------------------------
log "2/6 Environment file"
if [ -f .env ]; then
  add_result "Env file" "OK" ".env already exists, left untouched"
else
  cp .env.example .env
  add_result "Env file" "OK" "created .env from .env.example — set EXPO_PUBLIC_SUPABASE_URL/ANON_KEY and point EXPO_PUBLIC_API_URL at your local backend"
fi

# ---------------------------------------------------------------------------
log "3/6 Installing dependencies"
if npm install >/tmp/init-sh-front-npm-install.log 2>&1; then
  add_result "npm install" "OK" "dependencies installed"
else
  add_result "npm install" "FAIL" "see /tmp/init-sh-front-npm-install.log: $(tail -n 5 /tmp/init-sh-front-npm-install.log | tr '\n' ' ')"
  print_summary_and_exit
fi

# ---------------------------------------------------------------------------
log "4/6 Type-checking"
if [ -x node_modules/.bin/tsc ]; then
  if node_modules/.bin/tsc --noEmit >/tmp/init-sh-front-tsc.log 2>&1; then
    add_result "Type-check" "OK" "no type errors"
  else
    add_result "Type-check" "FAIL" "see /tmp/init-sh-front-tsc.log: $(tail -n 8 /tmp/init-sh-front-tsc.log | tr '\n' ' ')"
  fi
else
  add_result "Type-check" "FAIL" "node_modules/.bin/tsc not found after install"
fi

# ---------------------------------------------------------------------------
log "5/6 Expo config/dependency health (expo-doctor)"
if [ "$SKIP_DOCTOR" = true ]; then
  add_result "expo-doctor" "WARN" "skipped (--skip-doctor)"
elif npx --yes expo-doctor >/tmp/init-sh-front-doctor.log 2>&1; then
  add_result "expo-doctor" "OK" "no issues"
else
  add_result "expo-doctor" "WARN" "issues found (non-blocking) — see /tmp/init-sh-front-doctor.log: $(tail -n 6 /tmp/init-sh-front-doctor.log | tr '\n' ' ')"
fi

# ---------------------------------------------------------------------------
log "6/6 Running test suite"
if [ "$SKIP_TESTS" = true ]; then
  add_result "Tests" "WARN" "skipped (--skip-tests)"
elif ! npm run | grep -q '^  test$'; then
  add_result "Tests" "WARN" "no \"test\" script in package.json yet — set up a test runner (e.g. jest + @testing-library/react-native) when the first feature needs one, per docs/verification.md"
elif npm test >/tmp/init-sh-front-tests.log 2>&1; then
  add_result "Tests" "OK" "all tests passed"
else
  add_result "Tests" "FAIL" "see /tmp/init-sh-front-tests.log: $(tail -n 8 /tmp/init-sh-front-tests.log | tr '\n' ' ')"
fi

# ---------------------------------------------------------------------------
log "Web build smoke check (npx expo export)"
if [ "$SKIP_BUILD" = true ]; then
  add_result "Build check" "WARN" "skipped (--skip-build)"
else
  rm -rf /tmp/init-sh-front-export
  if npx --yes expo export --platform web --output-dir /tmp/init-sh-front-export >/tmp/init-sh-front-export.log 2>&1; then
    add_result "Build check" "OK" "web bundle exported cleanly"
  else
    add_result "Build check" "FAIL" "see /tmp/init-sh-front-export.log: $(tail -n 10 /tmp/init-sh-front-export.log | tr '\n' ' ')"
  fi
  rm -rf /tmp/init-sh-front-export
fi

print_summary_and_exit
