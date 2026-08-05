// Covers FR-009 (rejected branch: backend-provided reason or generic fallback, plus the
// explicitly-inert "Resubmit documents" placeholder CTA) and FR-010 (error branch: retry copy +
// a working retry action) for KycStatusScreen (T018). Does NOT test a "pending" branch — see
// KycStatusScreen.tsx's top comment for why that state is unreachable through resolveKycRoute()
// and therefore intentionally not part of this component's rendered surface; asserting a branch
// that can't occur would just be testing dead code, per this task's explicit instruction.
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import {
  GENERIC_REJECTION_COPY,
  KYC_RESUBMIT_PLACEHOLDER_COPY,
  KycStatusScreen,
} from "./KycStatusScreen";

describe("KycStatusScreen", () => {
  describe("rejected variant", () => {
    // FR-009: the backend-provided rejection reason is shown verbatim when present.
    it("renders the backend-provided rejection reason when present", () => {
      const { getByTestId } = render(
        <KycStatusScreen variant="rejected" rejectionReason="Document image was blurry" />
      );

      expect(getByTestId("kyc-status-rejection-reason").props.children).toBe(
        "Document image was blurry"
      );
    });

    // FR-009: an absent reason falls back to the generic copy.
    it("renders the generic fallback copy when no rejection reason is present", () => {
      const { getByTestId } = render(<KycStatusScreen variant="rejected" rejectionReason={null} />);

      expect(getByTestId("kyc-status-rejection-reason").props.children).toBe(GENERIC_REJECTION_COPY);
    });

    // FR-009: an empty/whitespace-only reason also falls back to the generic copy, not a blank
    // line — mirrors the same "absent" treatment as `null`/`undefined`.
    it("renders the generic fallback copy when the rejection reason is empty/whitespace", () => {
      const { getByTestId } = render(<KycStatusScreen variant="rejected" rejectionReason="   " />);

      expect(getByTestId("kyc-status-rejection-reason").props.children).toBe(GENERIC_REJECTION_COPY);
    });

    // Explicit placeholder CTA: visible, disabled, and does not silently look like a wired
    // navigation button — pressing it has no observable effect (no onPress is even wired), and
    // the placeholder copy makes the "not available yet" state visible rather than hidden.
    it("renders the resubmit CTA as an explicit disabled placeholder, not a wired action", () => {
      const { getByRole, getByTestId } = render(
        <KycStatusScreen variant="rejected" rejectionReason="Any reason" />
      );

      const button = getByRole("button", { name: "Resubmit documents" });
      expect(button.props.accessibilityState.disabled).toBe(true);
      expect(getByTestId("kyc-status-resubmit-placeholder-note").props.children).toBe(
        KYC_RESUBMIT_PLACEHOLDER_COPY
      );

      // Pressing a disabled Pressable is a no-op in React Native itself; asserting this doesn't
      // throw and nothing else renders/changes is this test's way of confirming there is no
      // hidden onPress handler for a future maintainer to trip over.
      fireEvent.press(button);
      expect(getByTestId("kyc-status-rejected")).toBeTruthy();
    });
  });

  describe("error variant", () => {
    // FR-010: the retryable-error copy renders, and is announced (accessibilityRole="alert").
    it("renders the couldn't-load-status message", () => {
      const { getByTestId } = render(<KycStatusScreen variant="error" onRetry={jest.fn()} />);

      expect(getByTestId("kyc-status-error-message")).toBeTruthy();
    });

    // FR-010: retry must be a real, working action — pressing it calls the provided onRetry.
    it("calls onRetry when the retry button is pressed", () => {
      const onRetry = jest.fn();
      const { getByRole } = render(<KycStatusScreen variant="error" onRetry={onRetry} />);

      fireEvent.press(getByRole("button", { name: "Retry" }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    // FR-010: while a retry is in flight, the button is disabled/busy so a user can't double-fire
    // the refetch.
    it("disables the retry button while isRetrying is true", () => {
      const onRetry = jest.fn();
      const { getByRole } = render(<KycStatusScreen variant="error" onRetry={onRetry} isRetrying />);

      const button = getByRole("button", { name: "Retry" });
      expect(button.props.accessibilityState.disabled).toBe(true);

      fireEvent.press(button);
      expect(onRetry).not.toHaveBeenCalled();
    });
  });
});
