# Social feature module

Mirrors the backend's `social` module, but currently holds no screens/components.

`004-home-scan-shell` originally scaffolded an Amigos/Social navigation surface here
(`AmigosPlaceholderScreen.tsx`, `SocialPlaceholderScreen.tsx`, and
`src/features/navigation/AmigosQuickAccessPill.tsx`). `008-scan-experience` retired all of it
outright (spec.md's Clarifications, "Recorded default 2") — Amigos and Social are no longer
reachable destinations, `/amigos` and `/social` resolve to expo-router's built-in "Unmatched
Route" fallback, and the placeholder screens/pill were deleted rather than kept as dead code.

This directory is intentionally empty of implementation files for now. A future feature that
gives the backend's `social` bounded context real frontend content starts fresh here, built on
top of `src/domain` (portable logic) and `src/lib` (Expo-specific wiring). See
`specs/008-scan-experience/spec.md` for the retirement decision, and `specs/` at the project
root generally for the spec defining what belongs here once that future feature exists.
