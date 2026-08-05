// Covers FR-007 (first-run tutorial content renders, and its one action calls the completion
// handler it's given). Side-effect wiring (local-storage write, cache invalidation, the
// resulting re-route) is covered by app/(onboarding)/tutorial.test.tsx — this file only covers
// the component's own rendered output/behavior (docs/verification.md Level 2).
import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { TutorialScreen } from "./TutorialScreen";

describe("TutorialScreen", () => {
  // FR-007: renders visible tutorial content, not a blank/placeholder screen.
  it("renders the welcome header and tutorial steps", () => {
    const { getByRole, getByTestId } = render(<TutorialScreen onComplete={jest.fn()} />);

    expect(getByRole("header")).toBeTruthy();
    expect(getByTestId("tutorial-step-0")).toBeTruthy();
  });

  // FR-007: pressing the primary action calls the onComplete prop — this component owns no
  // completion side effects itself (Constitution IV; see this file's top comment).
  it("calls onComplete when Get started is pressed", () => {
    const onComplete = jest.fn();
    const { getByRole } = render(<TutorialScreen onComplete={onComplete} />);

    fireEvent.press(getByRole("button", { name: "Get started" }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  // FR-007: while completion is in flight, the button is disabled/busy so a user can't double-fire it.
  it("disables the button while isCompleting is true", () => {
    const onComplete = jest.fn();
    const { getByRole } = render(<TutorialScreen onComplete={onComplete} isCompleting />);

    const button = getByRole("button", { name: "Get started" });
    expect(button.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(button);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
