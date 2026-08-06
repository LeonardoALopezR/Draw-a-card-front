// T027 (006-visual-identity): passthrough regression guard for both LoginScreenChrome variants
// (docs/design-brief-visual-identity.md §4.1 mobile, §4.2 web) — chrome supplies background
// decoration only and must never swallow or alter its children's content (FR-005: the platform
// difference is background/container treatment, not a behavioral one). Also confirms the web
// variant's centered card applies the documented maxWidth/padding/radius (§4.2).
//
// T051 (006-visual-identity, responsive layout check / SC-006): both variants also assert their
// content is wrapped in a real ScrollView (not a plain flex:1 View) via UNSAFE_getByType — the
// same technique HomeScreen.test.tsx (004-home-scan-shell, T020/T021) already uses for the
// identical assertion. A real browser/simulator wasn't available in this pass (same disclosed
// sandbox limitation as prior runs' Level 3 checks), so this is the strongest available
// substitute verification that a viewport shorter than the sign-in form's content can actually
// reach the rest of it instead of clipping it, matching HomeScreen.tsx/ScanShellScreen.tsx's
// existing fix.
import { render, screen } from "@testing-library/react-native";
import { ScrollView, StyleSheet, Text } from "react-native";

import { radius } from "@/theme";

import { LoginScreenChrome } from "./LoginScreenChrome";
import { LoginScreenChrome as WebLoginScreenChrome } from "./LoginScreenChrome.web";

describe("LoginScreenChrome (mobile/default)", () => {
  it("renders its children unchanged", () => {
    render(
      <LoginScreenChrome>
        <Text>Sign-in content</Text>
      </LoginScreenChrome>,
    );

    expect(screen.getByText("Sign-in content")).toBeTruthy();
  });

  it("wraps its content in a ScrollView, not a plain flex:1 View, so tall content on a short viewport stays reachable (T051, SC-006)", () => {
    render(
      <LoginScreenChrome>
        <Text>Sign-in content</Text>
      </LoginScreenChrome>,
    );

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    expect(scrollView.props.testID).toBe("login-chrome-content");
  });
});

describe("LoginScreenChrome.web", () => {
  it("renders its children unchanged", () => {
    render(
      <WebLoginScreenChrome>
        <Text>Sign-in content</Text>
      </WebLoginScreenChrome>,
    );

    expect(screen.getByText("Sign-in content")).toBeTruthy();
  });

  it("renders the centered card with the documented maxWidth, padding, and radius.card (§4.2)", () => {
    render(
      <WebLoginScreenChrome>
        <Text>Sign-in content</Text>
      </WebLoginScreenChrome>,
    );

    const card = screen.getByTestId("login-chrome-card");
    const style = StyleSheet.flatten(card.props.style);

    expect(style.maxWidth).toBe(660);
    expect(style.padding).toBe(48);
    expect(style.borderRadius).toBe(radius.card);
    // T051 (SC-006, 375px-wide viewport): width is percentage-based (100%), not a fixed pixel
    // value — maxWidth only caps how wide the card grows on a spacious viewport, it never forces
    // horizontal overflow on a narrow one (e.g. 375px minus the page's own horizontal padding).
    expect(style.width).toBe("100%");
  });

  it("wraps its content in a ScrollView, not a plain flex:1 View, so a card taller than the viewport stays reachable (T051, SC-006)", () => {
    render(
      <WebLoginScreenChrome>
        <Text>Sign-in content</Text>
      </WebLoginScreenChrome>,
    );

    const scrollView = screen.UNSAFE_getByType(ScrollView);
    expect(scrollView.props.testID).toBe("login-chrome-content");
  });
});
