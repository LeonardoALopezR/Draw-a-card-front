// 010-registration-redesign T011 (FR-012). Real-network behavior is [BLOCKED-ON-015] (see
// useNationalities.ts's own top comment) — this covers the wiring (loading/success/error/retry
// states) against a mocked src/domain/nationality.ts, which is fully exercisable today.
import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { nationalitiesQueryKey, useNationalities } from "./useNationalities";

// src/lib/api.ts imports src/lib/supabase-client.ts directly, which pulls in
// expo-secure-store/react-native (by design). This test has no need to exercise that for real —
// mocked the same way useKycGate.test.ts mocks it, so src/lib/api.ts's module graph still
// resolves without touching a real Supabase client.
jest.mock("@/lib/supabase-client", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
  },
}));

const mockFetchNationalities = jest.fn();
jest.mock("@/domain/nationality", () => ({
  fetchNationalities: (...args: unknown[]) => mockFetchNationalities(...args),
}));

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

function newTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useNationalities (FR-012)", () => {
  it("starts loading, with no options and no error yet", async () => {
    mockFetchNationalities.mockReturnValue(new Promise(() => {}));
    const client = newTestQueryClient();

    const { result } = renderHook(() => useNationalities(), { wrapper: makeWrapper(client) });

    expect(result.current.loading).toBe(true);
    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeUndefined();
  });

  it("exposes the fetched options once loaded (shaped for Select's `options`/`loading` props)", async () => {
    mockFetchNationalities.mockResolvedValue([
      { value: "MX", label: "Mexicana" },
      { value: "US", label: "Estadounidense" },
    ]);
    const client = newTestQueryClient();

    const { result } = renderHook(() => useNationalities(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.options).toEqual([
      { value: "MX", label: "Mexicana" },
      { value: "US", label: "Estadounidense" },
    ]);
    expect(result.current.error).toBeUndefined();
  });

  it("exposes a real error message on failure (shaped for Select's `error` prop)", async () => {
    mockFetchNationalities.mockRejectedValue(new Error("network down"));
    const client = newTestQueryClient();

    const { result } = renderHook(() => useNationalities(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.options).toEqual([]);
    expect(typeof result.current.error).toBe("string");
    expect(result.current.error).not.toBe("");
  });

  it("onRetry re-invokes fetchNationalities (shaped for Select's `onRetry` prop, a real retry not a no-op)", async () => {
    mockFetchNationalities.mockRejectedValueOnce(new Error("network down"));
    mockFetchNationalities.mockResolvedValueOnce([{ value: "MX", label: "Mexicana" }]);
    const client = newTestQueryClient();

    const { result } = renderHook(() => useNationalities(), { wrapper: makeWrapper(client) });

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(mockFetchNationalities).toHaveBeenCalledTimes(1);

    result.current.onRetry();

    await waitFor(() => expect(mockFetchNationalities).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.options).toEqual([{ value: "MX", label: "Mexicana" }]));
  });

  it("queries under the shared nationalitiesQueryKey", async () => {
    mockFetchNationalities.mockResolvedValue([]);
    const client = newTestQueryClient();

    renderHook(() => useNationalities(), { wrapper: makeWrapper(client) });

    await waitFor(() =>
      expect(client.getQueryState(nationalitiesQueryKey)?.status).toBe("success")
    );
  });
});
