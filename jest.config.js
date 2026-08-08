// Jest config for draw-a-card-front. Extends (does not replace) babel.config.js via the
// jest-expo preset, which wires babel-jest with Expo's metro-equivalent babel caller config.
// See docs/verification.md and specs/001-registration-kyc/plan.md ("Test tooling setup").
module.exports = {
  preset: "jest-expo",
  // Default jest testMatch (**/__tests__/** and *.test.ts(x)) already picks up files under
  // both src/ and app/ since jest's default `roots` is the project root — no override needed.
  // transformIgnorePatterns is inherited as-is from the jest-expo preset (see
  // node_modules/jest-expo/jest-preset.js) so React Native/Expo packages shipped as
  // untranspiled ESM in node_modules are still transformed correctly.
  //
  // T010 (specs/001-registration-kyc): mirrors tsconfig.json's "@/*" -> "./src/*" path alias
  // (metro/expo resolve it natively at bundle time; Jest needs its own mapping) — the first
  // test to import a file that uses the "@/..." alias internally (src/features/identity/
  // useKycGate.ts) is what surfaced the need for this; no prior test file exercised it.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Git worktrees created under .claude/worktrees/ are full copies of this repo (own app/,
  // src/ and node_modules). Without this, a run from the main checkout crawls into them and
  // executes every test twice — once against the nested node_modules — which both trips
  // "Haste module naming collision: draw-a-card-front" and fails the duplicated suites with
  // "__fbBatchedBridgeConfig is not set". Worktrees run their own jest from their own root.
  modulePathIgnorePatterns: ["<rootDir>/.claude/worktrees/"],
};
