// FR-001 (semantic tokens only), FR-003 (OrDivider matches brief §3 item 5), FR-013 (an inert
// element must not falsely present as interactive to a screen reader).
import { render, screen } from "@testing-library/react-native";

import { OrDivider } from "./OrDivider";

describe("OrDivider", () => {
  it("renders the centered lowercase 'o'", () => {
    render(<OrDivider />);

    expect(screen.getByText("o")).toBeTruthy();
  });

  // FR-013: purely decorative — must not be announced as a button/link to a screen reader.
  it("does not present the 'o' as an interactive element", () => {
    render(<OrDivider />);

    const label = screen.getByText("o");
    expect(label.props.accessibilityRole).toBeUndefined();
    expect(() => screen.getByRole("button")).toThrow();
    expect(() => screen.getByRole("link")).toThrow();
  });
});
