// Covers FR-002 (5-digit phone verification; successful verification proceeds to the profile
// step — the re-scoped destination, not the pre-re-scope kyc step) and the Edge Case: code
// expiry/resend for app/(auth)/verify-phone.tsx (T015). Mirrors register.test.tsx's (T012)
// mocking pattern exactly. Field-level error rendering and the resend-cooldown UI behavior
// themselves are covered directly by src/features/identity/VerifyPhoneScreen.test.tsx; this file
// covers the three behaviors T015 names explicitly for "a screen test": correct-code success,
// wrong-code inline error, and resend-disabled-during-countdown, at the actual screen (glue)
// level.
//
// 010-registration-redesign T019 (FR-008, FR-009, FR-010): extends this file with the
// draft-consumption branch verify-phone.tsx's success handler now has — draft-present-personal
// success, draft-present-personal failure (asserts /profile is reached AND the draft was
// genuinely cleared, not retried), draft-absent (asserts today's original unconditional-redirect
// behavior is unchanged), and the email-scoping guard (Run 5 review Finding 2) that refuses to
// auto-submit a draft that was not written for the account actually completing verification.
// Uses the REAL, unmocked src/lib/registration-draft.ts module throughout (not a mock) — the
// same choice CrearCuentaScreen.test.tsx (T017) already made — so these tests prove the actual
// atomic consume/clear contract, not merely that a mock was called with some shape.
//
// 010-registration-redesign T024 (FR-003, FR-008): adds an explicit business-path case
// (draft.kind === "business") asserting submitProfile is called with { isBusiness: true } and a
// tiendaProfileFormSchema-shaped payload — directly, not left as incidental coverage of the
// generic personal-draft case above.
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockVerifyPhoneCode = jest.fn();
const mockResendVerificationCode = jest.fn();
jest.mock("@/domain/registration", () => {
  const actual = jest.requireActual("@/domain/registration");
  return {
    ...actual,
    verifyPhoneCode: (...args: unknown[]) => mockVerifyPhoneCode(...args),
    resendVerificationCode: (...args: unknown[]) => mockResendVerificationCode(...args),
  };
});

const mockSubmitProfile = jest.fn();
jest.mock("@/domain/profile", () => {
  const actual = jest.requireActual("@/domain/profile");
  return {
    ...actual,
    submitProfile: (...args: unknown[]) => mockSubmitProfile(...args),
  };
});

const mockGetCurrentSessionEmail = jest.fn();
jest.mock("@/lib/supabase-client", () => ({
  getCurrentSessionEmail: () => mockGetCurrentSessionEmail(),
}));

// src/lib/api.ts pulls in supabase-client (React Native/Expo modules) purely to configure the
// real client — irrelevant here since verifyPhoneCode/resendVerificationCode/submitProfile are
// mocked above and never actually invoke it.
jest.mock("@/lib/api", () => ({ api: {} }));

import { clearRegistrationDraft, consumeRegistrationDraft, setRegistrationDraft } from "@/lib/registration-draft";
import VerifyPhoneRouteScreen from "./verify-phone";

const PERSONAL_DRAFT = {
  kind: "personal" as const,
  email: "ana@example.com",
  nombre: "Ana",
  apellidoPaterno: "Garcia",
  birthDate: new Date("1990-01-01T00:00:00.000Z"),
  nationality: "MX",
  curp: "GARA900101MDFXXX01",
  rfc: "GARA900101ABC",
  tosAccepted: true as const,
  privacyAccepted: true as const,
};

// 010-registration-redesign T024 (FR-003, FR-008): the Tienda tab's draft shape — every field
// tiendaCrearCuentaSchema/tiendaProfileFormSchema (src/domain/schemas.ts) actually collects, no
// personal-account field anywhere (mirrors CrearCuentaScreen's own kind: "business" branch,
// T017).
const BUSINESS_DRAFT = {
  kind: "business" as const,
  email: "tienda@example.com",
  commercialName: "Tienda Ana",
  rfc: "GARA900101ABC",
  fiscalAddress: "Av. Reforma 123, CDMX",
  tosAccepted: true as const,
  privacyAccepted: true as const,
};

function submitCode(getByLabelText: any, getByRole: any) {
  fireEvent.changeText(getByLabelText("Verification code"), "12345");
  fireEvent.press(getByRole("button", { name: "Verify code" }));
}

describe("VerifyPhoneRouteScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRegistrationDraft();
  });

  // FR-002: a correct code calls verifyPhoneCode with the api client + typed input, then
  // navigates to /profile (not /kyc — the 2026-08-04 re-scope's new destination). No draft was
  // ever written this session — today's original, unconditional-redirect behavior, unchanged by
  // T019.
  it("calls verifyPhoneCode and navigates to /profile on a correct-code submission (draft-absent, unchanged)", async () => {
    mockVerifyPhoneCode.mockResolvedValue({ phoneVerifiedAt: "2026-08-04T00:00:00.000Z" });

    const { getByLabelText, getByRole } = render(<VerifyPhoneRouteScreen />);
    submitCode(getByLabelText, getByRole);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/profile"));
    expect(mockVerifyPhoneCode).toHaveBeenCalledWith({}, { code: "12345" });
    expect(mockSubmitProfile).not.toHaveBeenCalled();
  });

  // FR-002: a wrong code surfaces the backend's PhoneCodeInvalid error as an inline error next
  // to the code field (via the real, unmocked mapVerifyPhoneError) — never an alert, and no
  // navigation happens.
  it("renders an inline error for a wrong code and does not navigate", async () => {
    const { ApiError } = jest.requireActual("@/domain/api-client");
    mockVerifyPhoneCode.mockRejectedValue(
      new ApiError(400, "PhoneCodeInvalid", "That verification code is incorrect")
    );

    const { getByLabelText, getByRole, getByText } = render(<VerifyPhoneRouteScreen />);
    submitCode(getByLabelText, getByRole);

    await waitFor(() => expect(getByText("That verification code is incorrect")).toBeTruthy());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // Edge Case (spec.md — code expiry/resend): pressing "Resend code" calls
  // resendVerificationCode once and immediately disables the button, so a second press before
  // the cooldown elapses does not call it again.
  it("calls resendVerificationCode once and disables the resend button during the cooldown", async () => {
    mockResendVerificationCode.mockResolvedValue({ message: "Verification code resent" });

    const { getByRole, getByTestId } = render(<VerifyPhoneRouteScreen />);

    const resendButton = getByRole("button", { name: "Resend code" });
    fireEvent.press(resendButton);

    await waitFor(() => expect(getByTestId("verify-phone-resend-message")).toBeTruthy());
    expect(mockResendVerificationCode).toHaveBeenCalledTimes(1);
    expect(mockResendVerificationCode).toHaveBeenCalledWith({});
    expect(resendButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(resendButton);
    expect(mockResendVerificationCode).toHaveBeenCalledTimes(1);
  });

  // T019 (FR-008, FR-009, plan.md Research Decision 1): a present draft, confirmed for the
  // account actually completing verification (draftMatchesEmail), is submitted immediately — no
  // second, user-visible form — and a successful submission proceeds to /tutorial, the same
  // destination profile.tsx's own successful submit already reaches today.
  it("auto-submits a present, confirmed personal draft and navigates to /tutorial on success", async () => {
    mockVerifyPhoneCode.mockResolvedValue({ phoneVerifiedAt: "2026-08-04T00:00:00.000Z" });
    mockGetCurrentSessionEmail.mockResolvedValue("ana@example.com");
    mockSubmitProfile.mockResolvedValue({ id: "user-1" });
    setRegistrationDraft(PERSONAL_DRAFT);

    const { getByLabelText, getByRole } = render(<VerifyPhoneRouteScreen />);
    submitCode(getByLabelText, getByRole);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/tutorial"));
    expect(mockSubmitProfile).toHaveBeenCalledWith(
      {},
      {
        nombre: "Ana",
        apellidoPaterno: "Garcia",
        birthDate: PERSONAL_DRAFT.birthDate,
        nationality: "MX",
        curp: "GARA900101MDFXXX01",
        rfc: "GARA900101ABC",
        tosAccepted: true,
        privacyAccepted: true,
      },
      { isBusiness: false }
    );
    // The draft is genuinely gone — a second consume returns undefined (atomicity, T009).
    expect(consumeRegistrationDraft()).toBeUndefined();
  });

  // 010-registration-redesign T024 (FR-003, FR-008): the Tienda (business) draft path, asserted
  // directly rather than left as incidental coverage of T019's generic (kind === "personal")
  // branch above. A confirmed business draft calls submitProfile with { isBusiness: true } and a
  // payload shaped exactly like tiendaProfileFormSchema (src/domain/schemas.ts) — commercialName/
  // rfc/fiscalAddress/tosAccepted/privacyAccepted only, no personal-account field anywhere.
  it("auto-submits a present, confirmed business draft with isBusiness: true and a tiendaProfileFormSchema-shaped payload", async () => {
    mockVerifyPhoneCode.mockResolvedValue({ phoneVerifiedAt: "2026-08-06T00:00:00.000Z" });
    mockGetCurrentSessionEmail.mockResolvedValue("tienda@example.com");
    mockSubmitProfile.mockResolvedValue({ id: "user-2" });
    setRegistrationDraft(BUSINESS_DRAFT);

    const { getByLabelText, getByRole } = render(<VerifyPhoneRouteScreen />);
    submitCode(getByLabelText, getByRole);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/tutorial"));
    expect(mockSubmitProfile).toHaveBeenCalledWith(
      {},
      {
        commercialName: "Tienda Ana",
        rfc: "GARA900101ABC",
        fiscalAddress: "Av. Reforma 123, CDMX",
        tosAccepted: true,
        privacyAccepted: true,
      },
      { isBusiness: true }
    );
    // No personal-account field (nombre/birthDate/nationality/curp) is ever part of the payload.
    const [, businessPayload] = mockSubmitProfile.mock.calls[0];
    expect(businessPayload).not.toHaveProperty("nombre");
    expect(businessPayload).not.toHaveProperty("birthDate");
    expect(businessPayload).not.toHaveProperty("nationality");
    expect(businessPayload).not.toHaveProperty("curp");
    // The draft is genuinely gone — a second consume returns undefined (atomicity, T009).
    expect(consumeRegistrationDraft()).toBeUndefined();
  });

  // T019 (FR-010): the automatic profile submission fails after a successful registration and
  // phone verification — the user lands on the existing resumable /profile screen, and the
  // draft is ALREADY cleared by consumeRegistrationDraft() (called before the submitProfile
  // attempt), so this is a genuine re-entry, not a silent retry with cached values (Constitution
  // III).
  it("routes to /profile and leaves the draft cleared, not retried, when the automatic profile submission fails", async () => {
    mockVerifyPhoneCode.mockResolvedValue({ phoneVerifiedAt: "2026-08-04T00:00:00.000Z" });
    mockGetCurrentSessionEmail.mockResolvedValue("ana@example.com");
    mockSubmitProfile.mockRejectedValue(new Error("network error"));
    setRegistrationDraft(PERSONAL_DRAFT);

    const { getByLabelText, getByRole } = render(<VerifyPhoneRouteScreen />);
    submitCode(getByLabelText, getByRole);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/profile"));
    expect(mockSubmitProfile).toHaveBeenCalledTimes(1);
    expect(consumeRegistrationDraft()).toBeUndefined();
  });

  // T019 (Run 5 review Finding 2 — the stale-draft-leak regression guard): a present draft that
  // was NOT written for the account actually completing verification (a stale draft left behind
  // by an earlier, abandoned sessionIssue attempt, now sitting unconsumed while a DIFFERENT
  // account signs in and reaches /verify-phone in the same JS session) must never be
  // auto-submitted under the wrong account — it is treated exactly like "no draft" and the user
  // reaches the same, safe /profile re-entry path.
  it("does not auto-submit a draft written for a different account, and falls through to the ordinary /profile redirect", async () => {
    mockVerifyPhoneCode.mockResolvedValue({ phoneVerifiedAt: "2026-08-04T00:00:00.000Z" });
    mockGetCurrentSessionEmail.mockResolvedValue("bob@example.com");
    setRegistrationDraft(PERSONAL_DRAFT);

    const { getByLabelText, getByRole } = render(<VerifyPhoneRouteScreen />);
    submitCode(getByLabelText, getByRole);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/profile"));
    expect(mockSubmitProfile).not.toHaveBeenCalled();
    // Still consumed (cleared), not left sitting around for a THIRD visitor to pick up either.
    expect(consumeRegistrationDraft()).toBeUndefined();
  });
});
