// Covers FR-007 (first-run tutorial completion: the local-storage write and the resulting React
// Query cache invalidation that lets useKycGate re-route to "main" on its next evaluation) for
// app/(onboarding)/tutorial.tsx (T019). Content rendering itself is covered directly by
// src/features/identity/TutorialScreen.test.tsx; this file covers the screen's own glue (calls
// markTutorialComplete + setHasCompletedTutorial, then invalidates currentUserQueryKey).
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockMarkTutorialComplete = jest.fn();
jest.mock("@/domain/registration", () => ({
  markTutorialComplete: (...args: unknown[]) => mockMarkTutorialComplete(...args),
}));

const mockSetHasCompletedTutorial = jest.fn();
jest.mock("@/lib/tutorial-storage", () => ({
  setHasCompletedTutorial: (...args: unknown[]) => mockSetHasCompletedTutorial(...args),
}));

const mockGetSession = jest.fn();
jest.mock("@/lib/supabase-client", () => ({
  supabase: { auth: { getSession: () => mockGetSession() } },
}));

// currentUserQueryKey is a plain exported const — importing the real module here (not mocking
// useKycGate.ts itself) keeps this test asserting against the actual shared key useKycGate.ts
// reads, rather than a value that could silently drift from it.
import { currentUserQueryKey } from "@/features/identity/useKycGate";
import TutorialRouteScreen from "./tutorial";

function renderWithClient(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <TutorialRouteScreen />
    </QueryClientProvider>
  );
}

describe("TutorialRouteScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarkTutorialComplete.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "auth-user-1" } } } });
  });

  // FR-007: pressing "Get started" calls markTutorialComplete() (the documented backend
  // placeholder), persists the local completion flag keyed by the Supabase auth user id, and
  // invalidates useKycGate's currentUserQueryKey so its query re-runs and resolveKycRoute()
  // re-resolves to "main" on the next render.
  it("marks the tutorial complete locally and invalidates the current-user query on completion", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { getByRole } = renderWithClient(client);

    fireEvent.press(getByRole("button", { name: "Get started" }));

    await waitFor(() => expect(mockMarkTutorialComplete).toHaveBeenCalledTimes(1));
    expect(mockSetHasCompletedTutorial).toHaveBeenCalledWith("auth-user-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: currentUserQueryKey });
  });

  // Defensive: a session that resolves with no user (shouldn't normally happen — this route is
  // only reachable per an already-resolved gate route, i.e. a session exists) still completes
  // the cache invalidation rather than throwing, it just skips the local write it has no user id
  // to key.
  it("still invalidates the cache even if no session user id is available", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { getByRole } = renderWithClient(client);

    fireEvent.press(getByRole("button", { name: "Get started" }));

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: currentUserQueryKey }));
    expect(mockSetHasCompletedTutorial).not.toHaveBeenCalled();
  });

  // T034 (2026-08-04, found auditing every supabase.auth.getSession() call site for the same
  // unhandled-rejection defect fixed in src/lib/supabase-client.ts and useKycGate.ts): getSession()
  // REJECTS (a network-level failure), not merely resolves with a null session. Before this fix,
  // this rejection was unguarded and skipped the cache invalidation entirely — the user pressed
  // "Get started" and was silently stranded on the tutorial screen with no error and no progress.
  it("still invalidates the cache even when the session check itself rejects (FR-007)", async () => {
    mockGetSession.mockRejectedValue(new TypeError("Network request failed"));
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");

    const { getByRole } = renderWithClient(client);

    fireEvent.press(getByRole("button", { name: "Get started" }));

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: currentUserQueryKey }));
    expect(mockSetHasCompletedTutorial).not.toHaveBeenCalled();
  });
});
