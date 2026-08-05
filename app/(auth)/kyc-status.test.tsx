// Covers FR-009 (rejected variant wiring) and FR-010 (error variant wiring, with a real retry
// call) for app/(auth)/kyc-status.tsx (T018) — the screen's own glue mapping useKycGate's
// resolved state onto KycStatusScreen's variant/props. Branch-copy rendering itself is covered
// directly by src/features/identity/KycStatusScreen.test.tsx; this file only asserts the mapping
// (statusFetchFailed -> "error", otherwise "rejected") and that the retry button really calls
// useKycGate's refetchStatus, not a no-op.
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

const mockUseKycGate = jest.fn();
jest.mock("@/features/identity/useKycGate", () => ({
  useKycGate: () => mockUseKycGate(),
}));

import KycStatusRouteScreen from "./kyc-status";

describe("KycStatusRouteScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // FR-009: statusFetchFailed: false + kycStatus: "rejected" maps to the "rejected" variant,
  // passing the gate's kycRejectionReason straight through.
  it("renders the rejected variant with the gate's rejection reason when the status fetch succeeded", () => {
    mockUseKycGate.mockReturnValue({
      route: "kyc-status",
      isLoading: false,
      kycStatus: "rejected",
      statusFetchFailed: false,
      kycRejectionReason: "Blurry document photo",
      refetchStatus: jest.fn(),
      isRefetching: false,
    });

    const { getByTestId } = render(<KycStatusRouteScreen />);

    expect(getByTestId("kyc-status-rejected")).toBeTruthy();
    expect(getByTestId("kyc-status-rejection-reason").props.children).toBe("Blurry document photo");
  });

  // FR-010: statusFetchFailed: true maps to the "error" variant regardless of any cached
  // kycStatus, and pressing Retry calls the gate's real refetchStatus function.
  it("renders the error variant and calls refetchStatus when Retry is pressed", () => {
    const refetchStatus = jest.fn();
    mockUseKycGate.mockReturnValue({
      route: "kyc-status",
      isLoading: false,
      kycStatus: undefined,
      statusFetchFailed: true,
      kycRejectionReason: undefined,
      refetchStatus,
      isRefetching: false,
    });

    const { getByTestId, getByRole } = render(<KycStatusRouteScreen />);

    expect(getByTestId("kyc-status-error")).toBeTruthy();
    fireEvent.press(getByRole("button", { name: "Retry" }));
    expect(refetchStatus).toHaveBeenCalledTimes(1);
  });
});
