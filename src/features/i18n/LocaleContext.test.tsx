// T021 tests (FR-010, FR-011, FR-012, spec.md US4 AS3/AS5): renders a consumer under the default
// <LocaleProvider> and confirms "es" strings resolve (FR-012's default-locale requirement); then
// exercises the setLocale() seam 007-localization's picker will call, via a test-only trigger
// component, and confirms re-rendering resolves "en" strings instead (FR-011's "seam exists and
// works" requirement).
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";

import { LocaleProvider, useLocale, useTranslation } from "./LocaleContext";

const testDictionary = {
  es: { greeting: "Hola" },
  en: { greeting: "Hello" },
};

function Consumer() {
  const t = useTranslation(testDictionary);
  return <Text testID="greeting">{t("greeting")}</Text>;
}

function LocaleSwitchTrigger() {
  const { locale, setLocale } = useLocale();
  return (
    <Pressable
      testID="switch-to-en"
      onPress={() => setLocale("en")}
      accessibilityRole="button"
      accessibilityLabel={`current locale: ${locale}`}
    >
      <Text>switch</Text>
    </Pressable>
  );
}

describe("LocaleContext (FR-010, FR-011, FR-012, spec.md US4 AS3/AS5)", () => {
  it("resolves 'es' strings by default (FR-012's documented fixed default)", () => {
    render(
      <LocaleProvider>
        <Consumer />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("greeting").props.children).toBe("Hola");
  });

  it("resolves 'en' strings after setLocale('en') is called via the context seam (FR-011)", () => {
    render(
      <LocaleProvider>
        <LocaleSwitchTrigger />
        <Consumer />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("greeting").props.children).toBe("Hola");

    fireEvent.press(screen.getByTestId("switch-to-en"));

    expect(screen.getByTestId("greeting").props.children).toBe("Hello");
  });

  it("useLocale() falls back to the default locale with a no-op setter when rendered outside a provider", () => {
    render(<Consumer />);

    expect(screen.getByTestId("greeting").props.children).toBe("Hola");
  });
});
