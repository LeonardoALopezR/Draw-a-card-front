// Global jest setup — see specs/015-ci-test-timeout/spec.md and plan.md's "actual
// jest-setup-file mechanism" Research Decision.
//
// Why: @expo/vector-icons' createIconSet.js (node_modules/@expo/vector-icons/build/
// createIconSet.js) builds an `Icon` class component whose initial state is
// `{ fontIsLoaded: Font.isLoaded(fontName) }`. When that's false (the default under jest,
// since no real font asset ever loads in a test environment), `componentDidMount` does
// `await Font.loadAsync(font)` and then `this.setState({ fontIsLoaded: true })` — a state
// update that lands *after* React Testing Library's `render()` has already returned, so it's
// never wrapped in `act()`. That's the source of every "An update to Icon inside a test was
// not wrapped in act(...)" warning in suites that render any icon family (Ionicons,
// MaterialCommunityIcons, etc.), repo-wide, per FR-004.
//
// Forcing `expo-font`'s `isLoaded` to always report `true` short-circuits that branch:
// `Icon`'s constructor-time state is already `fontIsLoaded: true`, so `componentDidMount`
// never awaits `Font.loadAsync` and never calls `setState` post-render. This covers every
// icon family automatically (nothing per-family to stub) since the fix targets the one
// shared code path, not the icon components themselves. `expo-font`'s other exports are left
// untouched via `jest.requireActual` so nothing else the module provides is affected.
jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  isLoaded: () => true,
}));
