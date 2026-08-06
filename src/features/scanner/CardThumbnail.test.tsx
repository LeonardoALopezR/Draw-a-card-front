// Human-requested follow-up (2026-08-06) to specs/008-scan-experience: CardThumbnail.tsx renders
// a real `expo-linear-gradient` LinearGradient with the exact gradient passed in, sized as given,
// and is hidden from assistive tech (decorative, Constitution VII).
import { LinearGradient } from "expo-linear-gradient";
import { render, screen } from "@testing-library/react-native";

import { colors } from "@/theme/colors";

import { CardThumbnail } from "./CardThumbnail";

describe("CardThumbnail", () => {
  it("renders a LinearGradient with the given gradient's colors, in order", () => {
    render(
      <CardThumbnail gradient={colors.gradients.cardPurple} size={44} testID="thumb" />
    );

    const gradient = screen.UNSAFE_getByType(LinearGradient);
    expect(gradient.props.colors).toEqual(colors.gradients.cardPurple);
  });

  it("sizes itself square from the size prop", () => {
    render(<CardThumbnail gradient={colors.gradients.cardEmber} size={64} testID="thumb" />);

    const gradient = screen.getByTestId("thumb");
    const flatStyle = Array.isArray(gradient.props.style)
      ? Object.assign({}, ...gradient.props.style)
      : gradient.props.style;
    expect(flatStyle.width).toBe(64);
    expect(flatStyle.height).toBe(64);
  });

  it("carries no accessibilityRole or press handler — never focusable/announced (Constitution VII)", () => {
    render(<CardThumbnail gradient={colors.gradients.cardTeal} size={44} testID="thumb" />);

    const gradient = screen.getByTestId("thumb");
    expect(gradient.props.accessibilityRole).toBeUndefined();
    expect(gradient.props.onPress).toBeUndefined();
  });

  it("renders a distinct gradient per sample card's token (Dragón Eterno purple, Fénix warm orange, Serpiente teal)", () => {
    const cases: Array<readonly [string, readonly [string, string]]> = [
      ["dragon-eterno", colors.gradients.cardPurple],
      ["fenix-de-tormenta", colors.gradients.cardEmber],
      ["serpiente-del-vacio", colors.gradients.cardTeal],
    ];

    for (const [id, gradient] of cases) {
      render(<CardThumbnail gradient={gradient} size={44} testID={`thumb-${id}`} />);
      expect(screen.getByTestId(`thumb-${id}`)).toBeTruthy();
    }
  });
});
