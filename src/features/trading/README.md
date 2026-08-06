# Trading feature module

Mirrors the backend's `trading` module. Screens/components for this domain live here,
built on top of `src/domain` (portable logic) and `src/lib` (Expo-specific wiring). See
`specs/` at the project root for the spec defining what belongs here.

## Current contents

`TradesPlaceholderScreen.tsx` (specs/008-scan-experience T028) — this module's first real
file, a contentless placeholder reserving the Trades shell destination (`app/(app)/trades.tsx`)
for a future trading feature. No trade/offer data or logic exists here yet.
