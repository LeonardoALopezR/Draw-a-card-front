// Covers FR-003 (business-specific fields at the profile step), FR-004 (typed profile fields,
// gated behind phone verification), and the ToS/privacy-acceptance piece of FR-007, via
// src/domain/profile.ts's submitProfile() — a thin wrapper around the real backend contract
// (Draw-a-card backend repo, POST /identity/me/profile). Uses the same hand-rolled mock
// ApiClient pattern as registration.test.ts — no fetch mocking needed.
import { ApiError, type ApiClient } from "./api-client";
import { SESSION_LOST_MESSAGE, type BackendUser } from "./registration";
import { isPhoneNotVerifiedError, mapProfileError, submitProfile } from "./profile";

const backendUserFixture: BackendUser = {
  id: "user-1",
  email: "ana@example.com",
  username: "ana_garcia",
  phone: "+525512345678",
  isBusiness: false,
  kycStatus: "pending",
  phoneVerifiedAt: "2026-08-04T00:00:00.000Z",
  nombre: "Ana",
  apellidoPaterno: "Garcia",
  apellidoMaterno: null,
  birthDate: "1990-01-01T00:00:00.000Z",
  nationality: "MX",
  curp: "GARA900101MDFXXX01",
  rfc: "GARA900101ABC",
  tosAcceptedAt: "2026-08-04T00:00:00.000Z",
  privacyAcceptedAt: "2026-08-04T00:00:00.000Z",
  createdAt: "2026-08-01T00:00:00.000Z",
};

const validPersonalInput = {
  nombre: "Ana",
  apellidoPaterno: "Garcia",
  // zod's ZodDate keeps a static input type of `Date` even with z.coerce.date() (a known zod v3
  // typing limitation — the runtime coercion accepts a string too, but the compile-time type
  // does not reflect that), so submitProfile()'s statically-typed callers must pass a Date here.
  birthDate: new Date("1990-01-01"),
  nationality: "MX",
  curp: "GARA900101MDFXXX01",
  rfc: "GARA900101ABC",
  tosAccepted: true as const,
  privacyAccepted: true as const,
};

const validBusinessInput = {
  ...validPersonalInput,
  commercialName: "Tienda Ana",
  fiscalAddress: "Calle Falsa 123, CDMX",
};

function mockClient<T>(implementation: (path: string, options?: RequestInit) => Promise<T>) {
  return implementation as unknown as ApiClient;
}

describe("submitProfile", () => {
  // FR-004: happy path (personal) — POST /identity/me/profile with the personal-only shape.
  it("calls POST /identity/me/profile with the personal fields and returns a domain User", async () => {
    let receivedPath = "";
    let receivedBody: Record<string, unknown> = {};
    const client = mockClient(async (path, options) => {
      receivedPath = path;
      receivedBody = JSON.parse((options?.body as string) ?? "{}");
      return { user: backendUserFixture };
    });

    const user = await submitProfile(client, validPersonalInput, { isBusiness: false });

    expect(receivedPath).toBe("/identity/me/profile");
    expect(receivedBody.nombre).toBe("Ana");
    expect(receivedBody.apellidoPaterno).toBe("Garcia");
    expect(receivedBody.tosAccepted).toBe(true);
    expect(receivedBody.privacyAccepted).toBe(true);
    // Personal submissions never send business-only fields, even as undefined keys.
    expect(receivedBody).not.toHaveProperty("commercialName");
    expect(user.nombre).toBe("Ana");
  });

  // FR-003, FR-004: happy path (business) — commercialName/fiscalAddress present alongside the
  // standard personal fields; rfc is the same field reused, not a separate business-RFC field.
  it("calls POST /identity/me/profile with business fields included when isBusiness is true", async () => {
    let receivedBody: Record<string, unknown> = {};
    const businessUserFixture: BackendUser = { ...backendUserFixture, isBusiness: true };
    const client = mockClient(async (_path, options) => {
      receivedBody = JSON.parse((options?.body as string) ?? "{}");
      return { user: businessUserFixture };
    });

    const user = await submitProfile(client, validBusinessInput, { isBusiness: true });

    expect(receivedBody.commercialName).toBe("Tienda Ana");
    expect(receivedBody.fiscalAddress).toBe("Calle Falsa 123, CDMX");
    expect(receivedBody.rfc).toBe("GARA900101ABC");
    expect(user.isBusiness).toBe(true);
  });

  // T032 (found by T021's manual smoke check, Defect 2), FR-004: an empty apellidoMaterno (the
  // real type-then-clear path — React Hook Form produces "" for a cleared field, not undefined)
  // must not be blocked, and must reach the backend as an omitted key, not a literal "" value —
  // JSON.stringify drops undefined-valued properties, so schemas.ts's optionalNonEmptyString
  // normalization (empty string -> undefined) is what keeps the wire payload correct.
  it("submits successfully with an empty apellidoMaterno and omits the key from the wire payload", async () => {
    let receivedBody: Record<string, unknown> = {};
    const client = mockClient(async (_path, options) => {
      receivedBody = JSON.parse((options?.body as string) ?? "{}");
      return { user: backendUserFixture };
    });

    await submitProfile(
      client,
      { ...validPersonalInput, apellidoMaterno: "" },
      { isBusiness: false }
    );

    expect(receivedBody).not.toHaveProperty("apellidoMaterno");
  });

  // FR-004: validation-error path — nombre missing is rejected client-side for a personal
  // submission, never reaching the network.
  it("throws a validation error and never calls the network when nombre is missing (personal)", async () => {
    const { nombre: _nombre, ...withoutNombre } = validPersonalInput;
    let called = false;
    const client = mockClient(async () => {
      called = true;
      return { user: backendUserFixture };
    });

    await expect(
      submitProfile(client, withoutNombre as never, { isBusiness: false })
    ).rejects.toThrow();
    expect(called).toBe(false);
  });

  // FR-003, FR-004: missing-RFC validation-error path (mirrors the backend's rule that RFC is a
  // required field on every profile submission — see profile.ts's doc comment on why this is
  // NOT a business-only rule despite the original task text framing it that way; RFC is
  // required for personal accounts too under the real backend contract, not just business
  // ones).
  it("throws a validation error and never calls the network when rfc is missing (business)", async () => {
    const { rfc: _rfc, ...withoutRfc } = validBusinessInput;
    let called = false;
    const client = mockClient(async () => {
      called = true;
      return { user: backendUserFixture };
    });

    await expect(
      submitProfile(client, withoutRfc as never, { isBusiness: true })
    ).rejects.toThrow();
    expect(called).toBe(false);
  });

  // FR-003: business-specific validation-error path — commercialName is required only for
  // business submissions (profileFormSchema alone would accept its absence).
  it("throws a validation error and never calls the network when commercialName is missing (business)", async () => {
    const { commercialName: _commercialName, ...withoutCommercialName } = validBusinessInput;
    let called = false;
    const client = mockClient(async () => {
      called = true;
      return { user: backendUserFixture };
    });

    await expect(
      submitProfile(client, withoutCommercialName as never, { isBusiness: true })
    ).rejects.toThrow();
    expect(called).toBe(false);
  });

  // FR-002, FR-004: a call made before the phone is verified (e.g. stale client state or direct
  // navigation) surfaces the backend's own rejection as a discriminable ApiError code
  // "PhoneNotVerified" (403) rather than a generic thrown string — this function does not
  // pre-check phoneVerifiedAt itself (see profile.ts's doc comment).
  it("surfaces the backend's PhoneNotVerified (403) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(
        403,
        "PhoneNotVerified",
        "Verify your phone before submitting profile information"
      );
    });

    await expect(
      submitProfile(client, validPersonalInput, { isBusiness: false })
    ).rejects.toMatchObject({ code: "PhoneNotVerified", status: 403 });
  });

  // FR-009 (backend spec): a business RFC already registered to another Tienda surfaces as a
  // discriminable ApiError code "RfcConflict" (409), enforced by a database-level unique
  // constraint the schema-level check above cannot catch.
  it("surfaces the backend's RfcConflict (409) error as a discriminable ApiError", async () => {
    const client = mockClient(async () => {
      throw new ApiError(409, "RfcConflict", "That RFC is already registered");
    });

    await expect(
      submitProfile(client, validBusinessInput, { isBusiness: true })
    ).rejects.toMatchObject({ code: "RfcConflict", status: 409 });
  });
});

// Covers T017's requirement to surface the backend's PhoneNotVerified rejection meaningfully
// (a redirect back to phone verification, not a bare form error) — isPhoneNotVerifiedError is
// the discriminator app/(auth)/profile.tsx uses to make that decision (FR-002, FR-004).
describe("isPhoneNotVerifiedError", () => {
  it("returns true for a PhoneNotVerified ApiError", () => {
    const error = new ApiError(403, "PhoneNotVerified", "Verify your phone first");
    expect(isPhoneNotVerifiedError(error)).toBe(true);
  });

  it("returns false for any other ApiError or a non-ApiError throw", () => {
    expect(isPhoneNotVerifiedError(new ApiError(409, "RfcConflict", "That RFC is taken"))).toBe(false);
    expect(isPhoneNotVerifiedError(new Error("network down"))).toBe(false);
  });
});

// FR-003, FR-004: mapProfileError maps the backend error codes submitProfile can receive to the
// specific ProfileFormInput field they correspond to, mirroring mapRegistrationError/
// mapVerifyPhoneError's already-tested pattern in registration.test.ts.
describe("mapProfileError", () => {
  it("maps RfcConflict to the rfc field", () => {
    const error = new ApiError(409, "RfcConflict", "That RFC is already registered");
    expect(mapProfileError(error)).toEqual({ field: "rfc", message: "That RFC is already registered" });
  });

  it("maps a ValidationError naming a known field to that field", () => {
    const error = new ApiError(400, "ValidationError", "Invalid profile submission", [
      { path: "curp", message: "CURP is invalid" },
    ]);
    expect(mapProfileError(error)).toEqual({ field: "curp", message: "CURP is invalid" });
  });

  it("falls back to a field-less message for an unmapped error", () => {
    expect(mapProfileError(new Error("network down"))).toEqual({
      message: "Something went wrong. Please try again.",
    });
  });

  // T033 (found by code-reviewer's second review, Finding 1 BLOCKING): if the X-User-Id wiring
  // ever regresses, submitProfile's Unauthenticated (401) must surface as this honest, actionable
  // session-lost message rather than a generic fallback.
  it("maps Unauthenticated to the actionable session-lost message, not a generic fallback", () => {
    const error = new ApiError(401, "Unauthenticated", "Authentication required");
    expect(mapProfileError(error)).toEqual({ message: SESSION_LOST_MESSAGE });
  });
});
