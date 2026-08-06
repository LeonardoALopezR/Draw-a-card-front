// T027 (specs/010-registration-redesign, FR-015): pure-function coverage for
// spaceKeyActivation's own logic — Level 1 (docs/verification.md), no rendering needed. The
// react-native-web-specific *reason* this helper exists (Space not reaching Pressable's onPress
// for non-"button" roles) is documented and cited in webKeyActivation.ts's own top comment and
// is not re-derived here; this file only proves the helper's own behavior.
import { spaceKeyActivation } from "./webKeyActivation";

describe("spaceKeyActivation (FR-015)", () => {
  it("calls activate and preventDefault on a Space key press", () => {
    const activate = jest.fn();
    const preventDefault = jest.fn();
    const { onKeyDown } = spaceKeyActivation(activate);

    onKeyDown({ key: " ", preventDefault });

    expect(activate).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("also recognizes the legacy 'Spacebar' key value", () => {
    const activate = jest.fn();
    const { onKeyDown } = spaceKeyActivation(activate);

    onKeyDown({ key: "Spacebar" });

    expect(activate).toHaveBeenCalledTimes(1);
  });

  it("does not call activate for any other key (Enter is react-native-web's own default, not this helper's job)", () => {
    const activate = jest.fn();
    const { onKeyDown } = spaceKeyActivation(activate);

    onKeyDown({ key: "Enter" });
    onKeyDown({ key: "a" });
    onKeyDown({});

    expect(activate).not.toHaveBeenCalled();
  });

  it("does nothing when disabled, even on a Space key press", () => {
    const activate = jest.fn();
    const preventDefault = jest.fn();
    const { onKeyDown } = spaceKeyActivation(activate, true);

    onKeyDown({ key: " ", preventDefault });

    expect(activate).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("tolerates a missing preventDefault on the event object", () => {
    const activate = jest.fn();
    const { onKeyDown } = spaceKeyActivation(activate);

    expect(() => onKeyDown({ key: " " })).not.toThrow();
    expect(activate).toHaveBeenCalledTimes(1);
  });
});
