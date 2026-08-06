// 010-registration-redesign T010 (FR-012). Real-network behavior is [BLOCKED-ON-015] (backend
// 015-registration-profile-support has no spec of its own yet — see nationality.ts's own top
// comment); this file covers the happy path and an error path against a mocked ApiClient, which
// is fully exercisable today.
import type { ApiClient } from "./api-client";
import { fetchNationalities, type NationalityOption } from "./nationality";

describe("fetchNationalities (FR-012)", () => {
  it("returns the catalog the client resolves with", async () => {
    const options: NationalityOption[] = [
      { value: "MX", label: "Mexicana" },
      { value: "US", label: "Estadounidense" },
    ];
    const client = jest.fn().mockResolvedValue(options) as unknown as ApiClient;

    await expect(fetchNationalities(client)).resolves.toEqual(options);
    expect(client).toHaveBeenCalledWith("/identity/nationalities", { method: "GET" });
  });

  it("returns an empty list when the backend catalog is empty, without throwing", async () => {
    const client = jest.fn().mockResolvedValue([]) as unknown as ApiClient;

    await expect(fetchNationalities(client)).resolves.toEqual([]);
  });

  it("propagates a network/API error rather than swallowing it", async () => {
    const client = jest.fn().mockRejectedValue(new Error("network down")) as unknown as ApiClient;

    await expect(fetchNationalities(client)).rejects.toThrow("network down");
  });
});
