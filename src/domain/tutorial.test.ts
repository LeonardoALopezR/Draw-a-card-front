// Covers FR-007 (first-run tutorial shown only once per user) — specifically the pure key-
// derivation logic src/lib/tutorial-storage.ts relies on (see tutorial.ts's own doc comment for
// why this is the one piece of "decision logic" this feature's local-storage fallback has).
import { tutorialStorageKey } from "./tutorial";

describe("tutorialStorageKey", () => {
  // FR-007: two different users must never collide on the same local storage key.
  it("derives a distinct key per supabase user id", () => {
    expect(tutorialStorageKey("user-a")).not.toBe(tutorialStorageKey("user-b"));
  });

  // FR-007: the key must be stable (same input -> same output) so a later read finds what an
  // earlier write stored.
  it("is stable for the same user id", () => {
    expect(tutorialStorageKey("user-a")).toBe(tutorialStorageKey("user-a"));
  });

  // FR-007: expo-secure-store keys are restricted to [A-Za-z0-9._-] — a real Supabase UUID
  // (hyphens only) must produce a key that stays within that character set end to end.
  it("produces an expo-secure-store-safe key for a UUID-shaped id", () => {
    const key = tutorialStorageKey("3fa85f64-5717-4562-b3fc-2c963f66afa6");
    expect(key).toMatch(/^[A-Za-z0-9._-]+$/);
  });
});
