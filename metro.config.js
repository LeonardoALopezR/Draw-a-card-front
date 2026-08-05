// T012 follow-up: expo-router (~3.5) has no built-in awareness of Jest's `*.test.ts(x)`
// convention — its route-discovery `require.context` (node_modules/expo-router/_ctx.*.js)
// matches every `.ts`/`.tsx`/`.js`/`.jsx` file under `app/` except `+api`/`+html`, which means a
// colocated `app/(auth)/register.test.tsx` (docs/conventions.md's "colocate `<file>.test.ts(x)`
// next to the file it tests") was otherwise turned into real, shipped routes ("/register.test",
// pulling the devDependency @testing-library/react-native into the production web bundle and
// crashing Metro's dev server via its ensure-peer-deps check). Block-listing `*.test.ts(x)` from
// Metro's module resolution keeps this repo's test colocation convention working for screens
// under `app/`, exactly as it already works for `src/`, without expo-router ever seeing those
// files as routes. Jest itself is unaffected — it reads jest.config.js, not this file.
const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = exclusionList([/\.test\.[jt]sx?$/]);

module.exports = config;
