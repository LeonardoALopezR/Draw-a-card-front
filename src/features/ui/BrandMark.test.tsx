// FR-001 (semantic tokens only, no raw hex/magic literal in the component body), FR-003 (the
// BrandMark shared primitive matches brief §3 item 1). docs/verification.md Level 2 — asserts
// rendered role/label/style, not a snapshot.
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { colors, radius } from "@/theme";

import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  // FR-013: every element carries a real accessibility label; BrandMark is decorative/branding,
  // exposed as an image with an explicit label rather than an unlabeled or button-like role.
  it("renders with an accessible image role and a 'Draw a Card' label", () => {
    render(<BrandMark />);

    const mark = screen.getByRole("image", { name: "Draw a Card" });
    expect(mark).toBeTruthy();
  });

  // FR-001/FR-003: brand.primary fill, radius.tile corner radius, shadow.raised elevation, and
  // the default 112px size (brief §3 item 1 — "112px on the login screen").
  it("applies the documented brand.primary fill, radius.tile radius, and shadow.raised elevation at the default 112px size", () => {
    render(<BrandMark />);

    const mark = screen.getByRole("image", { name: "Draw a Card" });
    const style = StyleSheet.flatten(mark.props.style);

    expect(style.backgroundColor).toBe(colors.brand.primary);
    expect(style.borderRadius).toBe(radius.tile);
    expect(style.width).toBe(112);
    expect(style.height).toBe(112);
    expect(style.shadowOpacity).toBeGreaterThan(0);
  });

  // The `size` prop lets a future screen reuse BrandMark at a different scale (task brief).
  it("resizes via the size prop", () => {
    render(<BrandMark size={56} />);

    const mark = screen.getByRole("image", { name: "Draw a Card" });
    const style = StyleSheet.flatten(mark.props.style);

    expect(style.width).toBe(56);
    expect(style.height).toBe(56);
  });

  // The "D" glyph renders in brand.onPrimary, using the display serif family (brief §3 item 1).
  it("renders a centered 'D' glyph in brand.onPrimary using the display serif family", () => {
    render(<BrandMark />);

    const glyph = screen.getByText("D");
    const style = StyleSheet.flatten(glyph.props.style);

    expect(style.color).toBe(colors.brand.onPrimary);
    expect(style.fontFamily).toBe("PlayfairDisplay_700Bold");
  });
});
