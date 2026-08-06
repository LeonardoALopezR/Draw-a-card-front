// T017 (specs/010-registration-redesign, FR-001, FR-006, FR-008, FR-009, plan.md Research
// Decision 1): real rendered-output/behavior tests (docs/verification.md Level 2) for both
// `CrearCuentaScreen` platform variants, run through the SAME shared assertion suite (mirroring
// LoginScreenChrome.test.tsx's own pattern of importing `./X` and `./X.web` side by side), plus a
// couple of web-only chrome assertions.
//
// Nacionalidad/backend-`015` disclosure (read before extending this file): CrearCuentaScreen now
// DOES call useNationalities() (T020, FR-012, spec.md Edge Cases) at the call-site boundary and
// threads its `options`/`loading`/`error`/`onRetry` straight through to `UsuarioForm`'s matching
// props — mocked below (`jest.mock("./useNationalities", ...)`) so this suite controls the
// catalog's loading/success/error state deterministically rather than depending on the real,
// `[BLOCKED-ON-015]` network call. Most of the pre-existing tests below still exercise the Tienda
// tab (needs no catalog at all) for their own unrelated assertions (tab switching, the
// four-credential-field split, the draft write, navigation, the sessionIssue/retry mechanism) —
// the dedicated "Nacionalidad wiring (T020)" block further down is what actually exercises the
// Usuario tab's loading/error/retry/success states through the real `useNationalities()` call
// site, complementing (not duplicating) UsuarioForm.test.tsx's own prop-level coverage of the
// same states.
import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// T029 fix (FR-016, safe-area insets, native variant only — CrearCuentaScreen.web.tsx never
// calls this hook): mirrors ShellHeader.test.tsx's identical mocking approach, since this repo's
// jest config doesn't auto-wire react-native-safe-area-context's own jest/mock.tsx, and the real
// hook throws with no <SafeAreaProvider> in the tree (see its own source, SafeAreaContext.tsx).
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: jest.fn(),
}));
const mockUseSafeAreaInsets = useSafeAreaInsets as jest.MockedFunction<typeof useSafeAreaInsets>;

const mockSubmitPersonalRegistration = jest.fn();
const mockSubmitBusinessRegistration = jest.fn();
const mockRetrySignIn = jest.fn();
jest.mock("@/domain/registration", () => {
  const actual = jest.requireActual("@/domain/registration");
  return {
    ...actual,
    submitPersonalRegistration: (...args: unknown[]) => mockSubmitPersonalRegistration(...args),
    submitBusinessRegistration: (...args: unknown[]) => mockSubmitBusinessRegistration(...args),
    retrySignIn: (...args: unknown[]) => mockRetrySignIn(...args),
  };
});

const mockSetCurrentUserId = jest.fn();
jest.mock("@/lib/api", () => ({ api: {}, setCurrentUserId: (...args: unknown[]) => mockSetCurrentUserId(...args) }));
jest.mock("@/lib/supabase-client", () => ({ signInWithPassword: "SIGN_IN_WITH_PASSWORD_FN" }));

// T020: both CrearCuentaScreen.tsx/.web.tsx import useNationalities from this same relative path
// ("./useNationalities"), so mocking it once here intercepts both variants. Defaults to a
// resolved, empty, non-erroring state so every pre-existing test below (which never inspects the
// Nacionalidad field) renders deterministically; the dedicated block further down overrides this
// per test to exercise the loading/error/retry/success states for real.
const mockUseNationalities = jest.fn();
jest.mock("./useNationalities", () => ({
  useNationalities: () => mockUseNationalities(),
}));

import { ApiError } from "@/domain/api-client";

// The real, unmocked in-memory draft module (T009) — using it directly (not a mock) lets these
// tests verify the ACTUAL draft object useCrearCuentaSubmit writes, via consumeRegistrationDraft,
// rather than only asserting a mock was called with some shape.
import { clearRegistrationDraft, consumeRegistrationDraft } from "@/lib/registration-draft";
import { currentUserQueryKey } from "@/features/identity/useKycGate";
import { space } from "@/theme";

import { CrearCuentaScreen } from "./CrearCuentaScreen";
import { CrearCuentaScreen as CrearCuentaScreenWeb } from "./CrearCuentaScreen.web";

const businessUserFixture = {
  id: "user-1",
  email: "tienda@example.com",
  username: "mi_tienda",
  isBusiness: true,
  kycStatus: "pending",
  hasCompletedTutorial: false,
  isPremium: false,
};

function fillTienda(getByLabelText: (label: string) => any, getByTestId: (id: string) => any) {
  fireEvent.changeText(getByLabelText("Nombre comercial"), "Mi Tienda de Cartas");
  fireEvent.changeText(getByLabelText("Correo electrónico"), "tienda@example.com");
  fireEvent.changeText(getByLabelText("Contraseña"), "supersecret1");
  fireEvent.changeText(getByTestId("tienda-username-input"), "mi_tienda");
  fireEvent.changeText(getByLabelText("RFC"), "MTC900101AAA");
  fireEvent.changeText(getByLabelText("Celular"), "+525512345678");
  fireEvent.changeText(getByLabelText("Domicilio fiscal"), "Calle Falsa 123, CP 00000");
  fireEvent.press(getByTestId("tienda-tos-checkbox"));
  fireEvent.press(getByTestId("tienda-privacy-checkbox"));
}

function renderScreen(Component: React.ComponentType) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return { client, ...render(<QueryClientProvider client={client}><Component /></QueryClientProvider>) };
}

function describeCrearCuentaScreen(name: string, Component: React.ComponentType) {
  describe(name, () => {
    beforeEach(() => {
      jest.clearAllMocks();
      clearRegistrationDraft();
      mockUseNationalities.mockReturnValue({ options: [], loading: false, error: undefined, onRetry: jest.fn() });
      mockUseSafeAreaInsets.mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 });
    });

    // FR-001: Usuario is selected by default, and both tabs' forms exist behind the switch.
    it("shows the shared title/subtitle chrome and defaults to the Usuario tab", () => {
      const { getByText, getByTestId, queryByTestId } = renderScreen(Component);

      expect(getByText("Crear cuenta")).toBeTruthy();
      expect(getByText("Completa tu perfil")).toBeTruthy();
      expect(getByTestId("usuario-form")).toBeTruthy();
      expect(queryByTestId("tienda-form")).toBeNull();
      expect(getByTestId("crear-cuenta-tabs-option-usuario").props.accessibilityState.checked).toBe(true);
      expect(getByTestId("crear-cuenta-tabs-option-tienda").props.accessibilityState.checked).toBe(false);
    });

    // FR-001: pressing the Tienda segment actually swaps the rendered form (not just a visual
    // style change) — and back.
    it("switching the segmented control swaps the rendered form", () => {
      const { getByTestId, queryByTestId } = renderScreen(Component);

      fireEvent.press(getByTestId("crear-cuenta-tabs-option-tienda"));
      expect(getByTestId("tienda-form")).toBeTruthy();
      expect(queryByTestId("usuario-form")).toBeNull();
      expect(getByTestId("crear-cuenta-tabs-option-tienda").props.accessibilityState.checked).toBe(true);

      fireEvent.press(getByTestId("crear-cuenta-tabs-option-usuario"));
      expect(getByTestId("usuario-form")).toBeTruthy();
      expect(queryByTestId("tienda-form")).toBeNull();
    });

    // FR-001, FR-003, FR-008, plan.md Research Decision 1: a successful Tienda submit calls
    // submitBusinessRegistration with ONLY the four credential fields (never the profile-step
    // fields), writes the remainder into the in-memory draft, and navigates to /verify-phone —
    // the exact orchestration this screen owns.
    it("submits the Tienda tab with only the four credential fields, writes the draft, and navigates to /verify-phone", async () => {
      mockSubmitBusinessRegistration.mockResolvedValue({ user: businessUserFixture, sessionError: null });

      const { getByLabelText, getByTestId } = renderScreen(Component);
      fireEvent.press(getByTestId("crear-cuenta-tabs-option-tienda"));
      fillTienda(getByLabelText, getByTestId);
      fireEvent.press(getByTestId("tienda-submit-button"));

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
      expect(mockSubmitBusinessRegistration).toHaveBeenCalledWith(
        {},
        "SIGN_IN_WITH_PASSWORD_FN",
        {
          email: "tienda@example.com",
          password: "supersecret1",
          phone: "+525512345678",
          username: "mi_tienda",
        }
      );
      expect(mockSubmitPersonalRegistration).not.toHaveBeenCalled();
      expect(mockSetCurrentUserId).toHaveBeenCalledWith(businessUserFixture.id);

      expect(consumeRegistrationDraft()).toEqual({
        kind: "business",
        email: "tienda@example.com",
        commercialName: "Mi Tienda de Cartas",
        rfc: "MTC900101AAA",
        fiscalAddress: "Calle Falsa 123, CP 00000",
        tosAccepted: true,
        privacyAccepted: true,
      });
    });

    // Carried-over review gap (Review round 3, Finding 2): the registration call's own REJECTION
    // path — mirroring the successful-submit test above's exact structure — was previously
    // exercised nowhere: mapRegistrationError itself is unit-tested in registration.test.ts, and
    // TiendaForm.test.tsx's/UsuarioForm.test.tsx's own "server-supplied field error" tests pass a
    // serverError prop directly into the form, bypassing this hook's catch block entirely. This
    // proves the actual wiring: submitBusinessRegistration rejecting -> mapRegistrationError ->
    // the right field's inline error -> no navigation -> no draft written.
    it("surfaces a mapped field error and does not navigate or write a draft when the registration call rejects", async () => {
      mockSubmitBusinessRegistration.mockRejectedValue(
        new ApiError(409, "UsernameTaken", "That username is already taken")
      );

      const { getByLabelText, getByTestId, findByText } = renderScreen(Component);
      fireEvent.press(getByTestId("crear-cuenta-tabs-option-tienda"));
      fillTienda(getByLabelText, getByTestId);
      fireEvent.press(getByTestId("tienda-submit-button"));

      expect(await findByText("That username is already taken")).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
      expect(mockSetCurrentUserId).not.toHaveBeenCalled();
      expect(consumeRegistrationDraft()).toBeUndefined();
    });

    // T026 (001-registration-kyc), carried forward: the returned isBusiness flag is cached under
    // the shared currentUserQueryKey — ProfileForm/profile.tsx's later isBusiness read depends on
    // this surviving the redesign unchanged.
    it("caches the returned isBusiness flag under currentUserQueryKey on a successful submit", async () => {
      mockSubmitBusinessRegistration.mockResolvedValue({ user: businessUserFixture, sessionError: null });

      const { getByLabelText, getByTestId, client } = renderScreen(Component);
      fireEvent.press(getByTestId("crear-cuenta-tabs-option-tienda"));
      fillTienda(getByLabelText, getByTestId);
      fireEvent.press(getByTestId("tienda-submit-button"));

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
      expect(client.getQueryData(currentUserQueryKey)).toMatchObject({ isBusiness: true });
    });

    // FR-001, FR-006, 001-registration-kyc T031 (regression guard, must not regress per this
    // batch's brief): registration succeeds but Supabase sign-in fails — the screen shows the
    // actionable session-issue message instead of navigating on as if a session exists, and the
    // draft is still written (the account itself was created).
    it("shows the session-issue recovery view and does not navigate when registration succeeds but sign-in fails", async () => {
      mockSubmitBusinessRegistration.mockResolvedValue({
        user: businessUserFixture,
        sessionError: "Email not confirmed",
      });

      const { getByLabelText, getByTestId, findByText, findByRole } = renderScreen(Component);
      fireEvent.press(getByTestId("crear-cuenta-tabs-option-tienda"));
      fillTienda(getByLabelText, getByTestId);
      fireEvent.press(getByTestId("tienda-submit-button"));

      await findByText("Tu cuenta fue creada");
      expect(await findByText(/Email not confirmed/)).toBeTruthy();
      expect(await findByRole("button", { name: "Reintentar inicio de sesión" })).toBeTruthy();
      expect(mockReplace).not.toHaveBeenCalled();
      // The draft was already written before the sessionError branch — still consumable once the
      // user does reach /verify-phone (via a later successful retry).
      expect(consumeRegistrationDraft()).toMatchObject({ kind: "business" });
    });

    // 001-registration-kyc T031: "Retry sign-in" retries ONLY the sign-in primitive (the account
    // already exists) and navigates once it succeeds.
    it("retries only the sign-in primitive on Retry, and navigates once it succeeds", async () => {
      mockSubmitBusinessRegistration.mockResolvedValue({
        user: businessUserFixture,
        sessionError: "Email not confirmed",
      });
      mockRetrySignIn.mockResolvedValue({ error: null });

      const { getByLabelText, getByTestId, findByRole } = renderScreen(Component);
      fireEvent.press(getByTestId("crear-cuenta-tabs-option-tienda"));
      fillTienda(getByLabelText, getByTestId);
      fireEvent.press(getByTestId("tienda-submit-button"));

      const retryButton = await findByRole("button", { name: "Reintentar inicio de sesión" });
      fireEvent.press(retryButton);

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/verify-phone"));
      expect(mockRetrySignIn).toHaveBeenCalledWith(
        "SIGN_IN_WITH_PASSWORD_FN",
        "tienda@example.com",
        "supersecret1"
      );
      expect(mockSubmitBusinessRegistration).toHaveBeenCalledTimes(1);
    });
  });
}

describeCrearCuentaScreen("CrearCuentaScreen (mobile/default)", CrearCuentaScreen);
describeCrearCuentaScreen("CrearCuentaScreen.web", CrearCuentaScreenWeb);

// T020 (FR-012, spec.md Edge Cases, `[BLOCKED-ON-015]` for real network behavior only): exercises
// the real `useNationalities()` call site (mocked above), proving the wiring reaches Select's
// rendered output end to end — not just that UsuarioForm accepts the right props in isolation
// (UsuarioForm.test.tsx's own job) or that useNationalities() returns the right shape in isolation
// (useNationalities.test.ts's own job).
function describeNacionalidadWiring(name: string, Component: React.ComponentType) {
  describe(`${name} — Nacionalidad wiring (T020)`, () => {
    beforeEach(() => {
      jest.clearAllMocks();
      clearRegistrationDraft();
      mockUseSafeAreaInsets.mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 });
    });

    it("passes useNationalities()'s options through to the Nacionalidad picker", () => {
      mockUseNationalities.mockReturnValue({
        options: [
          { value: "mx", label: "Mexicana" },
          { value: "us", label: "Estadounidense" },
        ],
        loading: false,
        error: undefined,
        onRetry: jest.fn(),
      });

      const { getByTestId } = renderScreen(Component);

      fireEvent.press(getByTestId("usuario-nationality-trigger"));
      expect(getByTestId("usuario-nationality-option-mx")).toBeTruthy();
      expect(getByTestId("usuario-nationality-option-us")).toBeTruthy();
    });

    it("disables the Nacionalidad picker and shows the loading state while useNationalities() is loading", () => {
      mockUseNationalities.mockReturnValue({
        options: [],
        loading: true,
        error: undefined,
        onRetry: jest.fn(),
      });

      const { getByTestId } = renderScreen(Component);

      expect(getByTestId("usuario-nationality-trigger").props.accessibilityState.disabled).toBe(true);
      expect(getByTestId("usuario-nationality-loading")).toBeTruthy();
    });

    // spec.md Edge Cases: the catalog-load error state is genuinely reachable today (backend 015
    // hasn't shipped) and must show a specific, LOCALIZED message — not useNationalities()'s own
    // un-localized English fallback string (see useNationalities.ts's own top comment) — with a
    // working retry that re-invokes the real onRetry the hook returned.
    it("surfaces a localized error and a working retry when useNationalities() reports a catalog-load error", () => {
      const onRetry = jest.fn();
      mockUseNationalities.mockReturnValue({
        options: [],
        loading: false,
        error: "We couldn't load the list of nationalities.",
        onRetry,
      });

      const { getByTestId, getByText, queryByText } = renderScreen(Component);

      expect(getByTestId("usuario-nationality-trigger").props.accessibilityState.disabled).toBe(true);
      expect(getByText("No pudimos cargar el catálogo de nacionalidades.")).toBeTruthy();
      expect(queryByText("We couldn't load the list of nationalities.")).toBeNull();

      fireEvent.press(getByTestId("usuario-nationality-retry"));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("shows no error and an operable picker when useNationalities() reports no error", () => {
      mockUseNationalities.mockReturnValue({
        options: [{ value: "mx", label: "Mexicana" }],
        loading: false,
        error: undefined,
        onRetry: jest.fn(),
      });

      const { getByTestId, queryByTestId } = renderScreen(Component);

      expect(getByTestId("usuario-nationality-trigger").props.accessibilityState.disabled).toBe(false);
      expect(queryByTestId("usuario-nationality-error")).toBeNull();
    });
  });
}

describeNacionalidadWiring("CrearCuentaScreen (mobile/default)", CrearCuentaScreen);
describeNacionalidadWiring("CrearCuentaScreen.web", CrearCuentaScreenWeb);

// T029 fix regression guard (FR-016, defect 1 of 2 — see this component's own top comment and
// progress/impl_010-registration-redesign.md "Run 11"): this is a real, structural proof that
// the hook is wired into the actual rendered style — NOT proof the title clears the status
// bar/Dynamic Island on a real device, which only a real simulator/device pass (T029) can show.
// Native-only: CrearCuentaScreen.web.tsx never calls useSafeAreaInsets() (see this file's own
// top comment on why the web variant, a centered card, doesn't need it).
describe("CrearCuentaScreen (mobile/default) — FR-016, T029 safe-area fix", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRegistrationDraft();
    mockUseNationalities.mockReturnValue({ options: [], loading: false, error: undefined, onRetry: jest.fn() });
  });

  it("pads the scrolled content by the theme base plus the device's non-zero safe-area insets", () => {
    mockUseSafeAreaInsets.mockReturnValue({ top: 59, bottom: 34, left: 10, right: 10 });

    const { UNSAFE_getAllByType } = renderScreen(CrearCuentaScreen);
    const content = UNSAFE_getAllByType(ScrollView).find(
      (node) => node.props.testID === "crear-cuenta-content",
    );
    const style = StyleSheet.flatten(content!.props.contentContainerStyle);

    expect(style.paddingTop).toBe(space.xxl + 59);
    expect(style.paddingLeft).toBe(space.xxl + 10);
    expect(style.paddingRight).toBe(space.xxl + 10);
  });

  it("falls back to the plain theme base padding when insets are zero (e.g. no notch)", () => {
    mockUseSafeAreaInsets.mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 });

    const { UNSAFE_getAllByType } = renderScreen(CrearCuentaScreen);
    const content = UNSAFE_getAllByType(ScrollView).find(
      (node) => node.props.testID === "crear-cuenta-content",
    );
    const style = StyleSheet.flatten(content!.props.contentContainerStyle);

    expect(style.paddingTop).toBe(space.xxl);
  });

  it("applies the same inset-aware padding to the session-issue recovery view", () => {
    mockSubmitBusinessRegistration.mockResolvedValue({
      user: businessUserFixture,
      sessionError: "Email not confirmed",
    });
    mockUseSafeAreaInsets.mockReturnValue({ top: 59, bottom: 34, left: 0, right: 0 });

    const { getByLabelText, getByTestId, UNSAFE_getAllByType } = renderScreen(CrearCuentaScreen);
    fireEvent.press(getByTestId("crear-cuenta-tabs-option-tienda"));
    fillTienda(getByLabelText, getByTestId);
    fireEvent.press(getByTestId("tienda-submit-button"));

    return waitFor(() => {
      const sessionIssue = UNSAFE_getAllByType(ScrollView).find(
        (node) => node.props.testID === "crear-cuenta-session-issue",
      );
      expect(sessionIssue).toBeTruthy();
      const style = StyleSheet.flatten(sessionIssue!.props.contentContainerStyle);
      expect(style.paddingTop).toBe(space.xxl + 59);
    });
  });
});

describe("CrearCuentaScreen.web — FR-016, plan.md Research Decision 6", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearRegistrationDraft();
    mockUseNationalities.mockReturnValue({ options: [], loading: false, error: undefined, onRetry: jest.fn() });
  });

  it("centers the screen in a card capped at AUTH_CARD_MAX_WIDTH (660, shared with /login)", () => {
    const { getByTestId } = renderScreen(CrearCuentaScreenWeb);

    const card = getByTestId("crear-cuenta-card");
    const style = StyleSheet.flatten(card.props.style);
    expect(style.maxWidth).toBe(660);
  });

  it("wraps its content in a ScrollView, not a plain flex:1 View, so a card taller than the viewport stays reachable", () => {
    const { UNSAFE_getAllByType } = renderScreen(CrearCuentaScreenWeb);

    // UNSAFE_getByType (singular) would be ambiguous here: the mounted (but closed) Nacionalidad
    // Select's FlatList renders its own internal ScrollView too — RN's <Modal> keeps its children
    // mounted even while `visible={false}`. Finding this screen's own top-level one by testID is
    // what actually distinguishes "wrapped in a real ScrollView" from "wrapped in a plain View".
    const scrollView = UNSAFE_getAllByType(ScrollView).find((node) => node.props.testID === "crear-cuenta-content");
    expect(scrollView).toBeTruthy();
  });
});
