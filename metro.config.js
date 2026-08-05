// T012 follow-up: expo-router (~3.5) has no built-in awareness of Jest's `*.test.ts(x)`
// convention — its route-discovery `require.context` (node_modules/expo-router/_ctx.*.js)
// matches every `.ts`/`.tsx`/`.js`/`.jsx` file under `app/` except `+api`/`+html`, which means a
// colocated `app/(auth)/register.test.tsx` (docs/conventions.md's "colocate `<file>.test.ts(x)`
// next to the file it tests") was otherwise turned into real, shipped routes ("/register.test",
// pulling the devDependency @testing-library/react-native into the production web bundle and
// crashing Metro's dev server via its ensure-peer-deps check). Block-listing `*.test.ts(x)` from
// Metro's module resolution keeps this repo's test colocation convention working for screens
// under `app/`, exactly as it already works for `src/`, without expo-router ever seeing those
// files as routes when Metro *bundles* the app (both `expo export` and `expo start`'s actual
// JS bundling go through this).
//
// IMPORTANT — this blockList does NOT reach every route-discovery code path. `expo start`'s
// interactive dev server additionally computes a route *manifest* via a separate, filesystem-
// globbing scan (`@expo/cli`'s `getRoutePaths` -> `expo-router`'s `getDirectoryTree`) that this
// `resolver.blockList` cannot filter at all (confirmed by reading both packages' installed
// source — there is no config hook for it in this expo-router/@expo-cli version). That scan is
// what crashes on colocated `_layout.*.test.tsx` files specifically ("the layouts ... conflict"
// on `expo start --web`, silent on `expo export`) — see docs/conventions.md's "Tests" section
// and progress/impl_004-home-scan-shell.md's dev-server-crash-fix entry for the fix (relocate
// those specific test files out of `app/`, not a config change here).
const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = exclusionList([/\.test\.[jt]sx?$/]);

module.exports = config;
