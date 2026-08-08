#!/usr/bin/env bash
# init.sh — one-shot local environment setup + verification for draw-a-card-front.
#
# Installs deps, type-checks, runs expo-doctor's config/dependency health check, verifies
# native dependency alignment, runs the test suite (if one is configured), and does bundle
# export smoke checks for all three targets (web, iOS, Android).
# Safe to re-run: each stage is idempotent.
#
# Usage: ./init.sh [--skip-doctor] [--skip-tests] [--skip-build] [--skip-native] [--skip-install]
# Exit code: 0 if every stage passed (warnings allowed), 1 if any stage failed.
#
# On the native stages (added 2026-08-04, after a broken iOS app passed every gate while this
# script only ever exported the web bundle):
#
#   * `expo export --platform ios|android` bundles the JS graph *as Metro resolves it for that
#     platform*. Web resolves through react-native-web and never touches the native module
#     graph, so a web-only export cannot see a broken `.ios.tsx`, a native-only import, or a
#     platform-specific resolution failure. These stages close that gap.
#   * They do NOT compile a native binary and therefore CANNOT catch a native-module version
#     mismatch (e.g. "Cannot find native module 'ExpoLinking'") — that surfaces only at runtime
#     in Expo Go / a dev client. The "Native dependency alignment" stage below is what guards
#     that class, by verifying installed versions match the SDK and that expo-router's peer
#     dependencies are declared in package.json rather than floating to whatever npm hoists.
#   * A true native compile would need `expo prebuild`, which writes ios/ and android/ into a
#     managed-workflow repo. Deliberately not done here; run it yourself when you need it.
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
SKIP_NATIVE=false
SKIP_INSTALL=false
for arg in "$@"; do
  case "$arg" in
    --skip-doctor) SKIP_DOCTOR=true ;;
    --skip-tests) SKIP_TESTS=true ;;
    --skip-build) SKIP_BUILD=true ;;
    --skip-native) SKIP_NATIVE=true ;;
    --skip-install) SKIP_INSTALL=true ;;
    -h|--help)
      echo "Usage: ./init.sh [--skip-doctor] [--skip-tests] [--skip-build] [--skip-native] [--skip-install]"
      echo "  --skip-native   skip the iOS/Android bundle exports (web export still runs)"
      echo "  --skip-install  skip 'npm install' in stage 3 — for callers (e.g. CI) that already"
      echo "                  installed dependencies themselves (e.g. via 'npm ci')"
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
log "1/8 Checking prerequisites"
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
log "2/8 Environment file"
if [ -f .env ]; then
  add_result "Env file" "OK" ".env already exists, left untouched"
else
  cp .env.example .env
  add_result "Env file" "OK" "created .env from .env.example — set EXPO_PUBLIC_SUPABASE_URL/ANON_KEY and point EXPO_PUBLIC_API_URL at your local backend"
fi

# ---------------------------------------------------------------------------
log "3/8 Installing dependencies"
if [ "$SKIP_INSTALL" = true ]; then
  add_result "npm install" "OK" "skipped (--skip-install) — dependencies already installed by the caller"
elif npm install >/tmp/init-sh-front-npm-install.log 2>&1; then
  add_result "npm install" "OK" "dependencies installed"
else
  add_result "npm install" "FAIL" "see /tmp/init-sh-front-npm-install.log: $(tail -n 5 /tmp/init-sh-front-npm-install.log | tr '\n' ' ')"
  print_summary_and_exit
fi

# ---------------------------------------------------------------------------
log "4/8 Type-checking"
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
log "5/8 Expo config/dependency health (expo-doctor)"
if [ "$SKIP_DOCTOR" = true ]; then
  add_result "expo-doctor" "WARN" "skipped (--skip-doctor)"
elif npx --yes expo-doctor >/tmp/init-sh-front-doctor.log 2>&1; then
  add_result "expo-doctor" "OK" "no issues"
else
  add_result "expo-doctor" "WARN" "issues found (non-blocking) — see /tmp/init-sh-front-doctor.log: $(tail -n 6 /tmp/init-sh-front-doctor.log | tr '\n' ' ')"
fi

# ---------------------------------------------------------------------------
# Guards the bug class that a bundle export cannot see: a native module whose JS resolves fine
# but whose native counterpart doesn't exist in the running SDK. Two distinct checks:
#   (a) installed versions vs. what the pinned Expo SDK expects (`expo install --check`);
#   (b) expo-router's peerDependencies actually being declared in package.json. (b) is the one
#       that matters most — expo-router declares `expo-linking`/`expo-constants` as peers with a
#       wildcard "*" range. Undeclared, npm auto-installs them at the newest major (57.x for an
#       SDK 51 project), the JS resolves, and the app dies at runtime with "Cannot find native
#       module 'ExpoLinking'". Declaring them is what makes (a) able to see them at all.
log "6/8 Native dependency alignment"
if [ "$SKIP_DOCTOR" = true ]; then
  add_result "Native deps" "WARN" "skipped (--skip-doctor)"
else
  undeclared=$(node -e '
    const pkg = require("./package.json");
    const declared = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    let peers = {};
    try { peers = require("./node_modules/expo-router/package.json").peerDependencies || {}; }
    catch (e) { process.exit(0); }
    // react-native-reanimated and @react-navigation/drawer are genuinely optional for this
    // app (no drawer navigator, no reanimated usage) — only flag peers that are actually
    // installed, i.e. ones npm resolved on our behalf without us pinning them.
    const missing = Object.keys(peers).filter((name) => {
      if (declared[name]) return false;
      try { require.resolve(name + "/package.json"); return true; } catch (e) { return false; }
    });
    process.stdout.write(missing.join(" "));
  ' 2>/dev/null)

  check_log=/tmp/init-sh-front-expo-install-check.log
  npx --yes expo install --check >"$check_log" 2>&1
  check_rc=$?

  if [ -n "$undeclared" ]; then
    add_result "Native deps" "FAIL" "expo-router peer dependencies are installed but NOT declared in package.json: ${undeclared} — npm resolves these to the newest major (SDK-incompatible), the JS still bundles, and the app crashes at runtime with 'Cannot find native module'. Fix: npx expo install ${undeclared}"
  elif [ "$check_rc" -ne 0 ]; then
    add_result "Native deps" "WARN" "peers declared, but some package versions differ from the pinned SDK's expectations (non-blocking) — see $check_log: $(tail -n 8 "$check_log" | tr '\n' ' ')"
  else
    add_result "Native deps" "OK" "expo-router peers declared; installed versions match the pinned Expo SDK"
  fi
fi

# ---------------------------------------------------------------------------
log "7/8 Running test suite"
# In CI (GitHub Actions sets CI=true automatically for every workflow step — no workflow-file
# edit needed), jest's default worker pool oversubscribes the runner's 2-4 vCPUs badly enough
# that cross-test/cross-suite CPU contention alone pushes an otherwise-fast test past jest's
# 5000ms per-test timeout (measured: the same test 69ms at --maxWorkers=1 vs 308ms at jest's
# local default of 13 workers on a 14-core dev machine — see specs/015-ci-test-timeout/spec.md's
# Round 2 Amendment). --runInBand (a single worker, zero contention by construction) eliminates
# that root cause. Scoped to CI only — jest.config.js intentionally does NOT set this, so a
# developer's local run stays fully parallel and unaffected (specs/015-ci-test-timeout FR-009).
#
# Round 3: --runInBand alone still wasn't enough — CI's jest transform cache
# (jest.config.js's cacheDirectory) is cold on a fresh runner even with actions/cache doing its
# best (a MISS still pays the full cost), and a cold-cache run measured 3885ms against jest's
# 5000ms default, only 22% headroom. --testTimeout=15000 (CI only, well over the measured 3885ms
# cold-cache worst case) absorbs that unavoidable one-time cost. This is a deliberate,
# human-authorized exception to this feature's own FR-006 (2026-08-07 sign-off: the human chose
# options (a) [cache the transform, see .github/workflows/ci.yml] + (c) [this scoped
# --testTimeout] together) — NOT a bypass, and NOT a license to let a genuinely slow test hide:
# jest.config.js deliberately does NOT get this override, so a developer's local run keeps
# jest's strict 5000ms default and a genuinely slow test still fails fast in development.
if [ "$SKIP_TESTS" = true ]; then
  add_result "Tests" "WARN" "skipped (--skip-tests)"
elif ! node -e 'process.exit(require("./package.json").scripts?.test ? 0 : 1)' 2>/dev/null; then
  add_result "Tests" "WARN" "no \"test\" script in package.json yet — set up a test runner (e.g. jest + @testing-library/react-native) when the first feature needs one, per docs/verification.md"
elif [ "${CI:-}" = "true" ]; then
  # --verbose emits each test's own duration ("✓ name (148 ms)"), which is what makes a per-test
  # timeout regression measurable from a PASSING CI run rather than only inferable from the
  # suite total. The extra lines are cheap here: this output goes to the log file below, which
  # the workflow prints inside a collapsed ::group::, so it costs a reader nothing unopened.
  if npm test -- --runInBand --verbose --testTimeout=15000 >/tmp/init-sh-front-tests.log 2>&1; then
    add_result "Tests" "OK" "all tests passed (--runInBand, CI=true)"
  else
    add_result "Tests" "FAIL" "see /tmp/init-sh-front-tests.log: $(tail -n 8 /tmp/init-sh-front-tests.log | tr '\n' ' ')"
  fi
elif npm test >/tmp/init-sh-front-tests.log 2>&1; then
  add_result "Tests" "OK" "all tests passed"
else
  add_result "Tests" "FAIL" "see /tmp/init-sh-front-tests.log: $(tail -n 8 /tmp/init-sh-front-tests.log | tr '\n' ' ')"
fi

# ---------------------------------------------------------------------------
# One export per target. Metro resolves a different module graph per platform (.ios.tsx /
# .android.tsx / .web.tsx / .native.tsx), so a green web export says nothing about whether the
# native graph even bundles — which is exactly how a broken iOS app passed this script for an
# entire feature. Each platform is its own stage so the summary names the one that broke.
log "8/8 Bundle export smoke checks (web, iOS, Android)"
if [ "$SKIP_BUILD" = true ]; then
  add_result "Build check" "WARN" "skipped (--skip-build)"
else
  for platform in web ios android; do
    if [ "$platform" != "web" ] && [ "$SKIP_NATIVE" = true ]; then
      add_result "Build check ($platform)" "WARN" "skipped (--skip-native)"
      continue
    fi

    out_dir="/tmp/init-sh-front-export-${platform}"
    plat_log="/tmp/init-sh-front-export-${platform}.log"
    rm -rf "$out_dir"

    if npx --yes expo export --platform "$platform" --output-dir "$out_dir" >"$plat_log" 2>&1; then
      add_result "Build check ($platform)" "OK" "$platform bundle exported cleanly"
    else
      add_result "Build check ($platform)" "FAIL" "see $plat_log: $(tail -n 10 "$plat_log" | tr '\n' ' ')"
    fi

    rm -rf "$out_dir"
  done
fi

print_summary_and_exit
