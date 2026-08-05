// Covers FR-002 (5-digit phone verification; successful verification proceeds to the profile
// step — the re-scoped destination, not the pre-re-scope kyc step) and the Edge Case: code
// expiry/resend for app/(auth)/verify-phone.tsx (T015). Mirrors register.test.tsx's (T012)
// mocking pattern exactly. Field-level error rendering and the resend-cooldown UI behavior
// themselves are covered directly by src/features/identity/VerifyPhoneScreen.test.tsx; this file
// covers the three behaviors T015 names explicitly for "a screen test": correct-code success,
// wrong-code inline error, and resend-disabled-during-countdown, at the actual screen (glue)
// level.
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

// src/lib/api.ts pulls in supabase-client (React Native/Expo modules) purely to configure the
// real client — irrelevant here since verifyPhoneCode/resendVerificationCode are mocked above
// and never actually invoke it.
jest.mock("@/lib/api", () => ({ api: {} }));

import VerifyPhoneRouteScreen from "./verify-phone";

describe("VerifyPhoneRouteScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // FR-002: a correct code calls verifyPhoneCode with the api client + typed input, then
  // navigates to /profile (not /kyc — the 2026-08-04 re-scope's new destination).
  it("calls verifyPhoneCode and navigates to /profile on a correct-code submission", async () => {
    mockVerifyPhoneCode.mockResolvedValue({ phoneVerifiedAt: "2026-08-04T00:00:00.000Z" });

    const { getByLabelText, getByRole } = render(<VerifyPhoneRouteScreen />);

    fireEvent.changeText(getByLabelText("Verification code"), "12345");
    fireEvent.press(getByRole("button", { name: "Verify code" }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/profile"));
    expect(mockVerifyPhoneCode).toHaveBeenCalledWith({}, { code: "12345" });
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

    fireEvent.changeText(getByLabelText("Verification code"), "99999");
    fireEvent.press(getByRole("button", { name: "Verify code" }));

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
});
