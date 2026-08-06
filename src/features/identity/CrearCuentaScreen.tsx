// T017 (specs/010-registration-redesign, FR-001, FR-006, plan.md Research Decision 1):
// mobile/default `Crear cuenta` screen — composes the `Usuario`/`Tienda` `SegmentedControl`
// (T005, defaulting to `Usuario`), `UsuarioForm`/`TiendaForm` (T015/T016), and the shared
// title/subtitle chrome (design brief §2). All submit/draft-write/navigation orchestration lives
// in `useCrearCuentaSubmit` (this directory) — see that file's own top comment for why it's a
// shared hook rather than duplicated logic across this file and `CrearCuentaScreen.web.tsx`. This
// file's own job is purely the mobile layout: a single scrolling column directly on `bg.page`
// (design brief §2 Layout — "inputs are white pills floating directly on it"), mirroring
// `LoginScreenChrome.tsx`'s identical `ScrollView`-on-`bg.page` treatment (including the same
// `keyboardShouldPersistTaps="handled"` fix for a dead first tap while a field's keyboard is
// still open).
//
// Reuses the exact `sessionIssue`/`retrySignIn` recovery UI `app/(auth)/register.tsx` already
// has for a registration-succeeded-but-sign-in-failed outcome (001-registration-kyc T031) — see
// `useCrearCuentaSubmit.ts`'s top comment for where that mechanism now lives. This regression
// guard is exercised by `CrearCuentaScreen.test.tsx`.
//
// T029 fix (real iOS Simulator pass, defect 1 of 2 — see progress/impl_010-registration-
// redesign.md, "Run 11"): this screen renders behind `app/(auth)/_layout.tsx`'s
// `headerShown: false` Stack, so nothing else on this route accounts for the status bar/Dynamic
// Island — without it, the title rendered underneath at rest. Same defect class
// `004-home-scan-shell` already hit and fixed with `useSafeAreaInsets()`
// (`react-native-safe-area-context`, already a project dependency — see `ShellHeader.tsx`'s
// identical `16-base + insets.top/insets.left/insets.right` pattern, reused verbatim here rather
// than inventing a second approach). `useSafeAreaInsets()` is 0 on web, so this is a no-op there
// — consistent with why `CrearCuentaScreen.web.tsx` (a centered card, not a full-bleed screen)
// doesn't need this at all.
//
// T020 (FR-012, spec.md Edge Cases, `[BLOCKED-ON-015]` for real network behavior only): this is
// the `CrearCuentaScreen`/`UsuarioForm` call-site boundary `UsuarioForm.tsx`'s own top comment
// names — `useNationalities()` (T011) is called here, once, and its `options`/`loading`/`error`/
// `onRetry` are threaded straight through to `UsuarioForm`'s matching props, which themselves
// pass straight through to `Select`'s `loading`/`error`/`onRetry` slots (no hardcoded fallback
// nationality list anywhere in that chain). `error` is re-localized here (not left as
// `useNationalities`'s own un-localized fallback string — see that file's top comment) via
// `registrationCopy`'s `nationalityLoadError` key (T013 dictionary), so FR-007 holds even on the
// one nationality state that's genuinely reachable today, since backend `015` hasn't shipped.
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { registrationCopy } from "@/domain/i18n/copy/registration";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { SegmentedControl } from "@/features/ui/SegmentedControl";
import { colors, space, typography } from "@/theme";

import { TiendaForm } from "./TiendaForm";
import { UsuarioForm } from "./UsuarioForm";
import { useCrearCuentaSubmit, type CrearCuentaTab } from "./useCrearCuentaSubmit";
import { useNationalities } from "./useNationalities";

export function CrearCuentaScreen() {
  const t = useTranslation(registrationCopy);
  const insets = useSafeAreaInsets();
  const {
    tab,
    setTab,
    isSubmitting,
    serverError,
    sessionIssue,
    isRetryingSignIn,
    handleUsuarioSubmit,
    handleTiendaSubmit,
    handleRetrySignIn,
  } = useCrearCuentaSubmit();
  const nationalities = useNationalities();

  // ShellHeader.tsx's exact pattern (see this file's top comment) — 0 on web, a no-op there.
  const insetStyle = {
    paddingTop: space.xxl + insets.top,
    paddingLeft: space.xxl + insets.left,
    paddingRight: space.xxl + insets.right,
  };

  if (sessionIssue) {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={[styles.sessionContainer, insetStyle]}
        keyboardShouldPersistTaps="handled"
        testID="crear-cuenta-session-issue"
      >
        <Text style={styles.sessionTitle} accessibilityRole="header">
          {t("sessionIssueTitle")}
        </Text>
        <Text style={styles.sessionBody} accessibilityRole="alert">
          {t("sessionIssueBodyPrefix")}
          {sessionIssue.message}
          {t("sessionIssueBodySuffix")}
        </Text>
        <PrimaryButton
          label={isRetryingSignIn ? t("retrySignInBusyLabel") : t("retrySignInLabel")}
          onPress={handleRetrySignIn}
          busy={isRetryingSignIn}
          testID="crear-cuenta-retry-sign-in-button"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.container, insetStyle]}
      keyboardShouldPersistTaps="handled"
      testID="crear-cuenta-content"
    >
      <View style={styles.column}>
        <Text style={styles.title} accessibilityRole="header">
          {t("title")}
        </Text>
        <Text style={styles.subtitle}>{t("subtitle")}</Text>

        <SegmentedControl
          options={[
            { label: t("usuarioTabLabel"), value: "usuario" },
            { label: t("tiendaTabLabel"), value: "tienda" },
          ]}
          value={tab}
          onChange={(value) => setTab(value as CrearCuentaTab)}
          testID="crear-cuenta-tabs"
        />

        {tab === "usuario" ? (
          <UsuarioForm
            onSubmit={handleUsuarioSubmit}
            isSubmitting={isSubmitting}
            serverError={serverError}
            nationalityOptions={nationalities.options}
            nationalityLoading={nationalities.loading}
            nationalityError={nationalities.error ? t("nationalityLoadError") : undefined}
            onRetryNationality={nationalities.onRetry}
          />
        ) : (
          <TiendaForm onSubmit={handleTiendaSubmit} isSubmitting={isSubmitting} serverError={serverError} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg.page,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: space.xxl,
  },
  column: {
    width: "100%",
    maxWidth: 480,
    gap: space.xl,
  },
  title: {
    fontSize: typography.display.lg.fontSize,
    fontWeight: typography.display.lg.fontWeight,
    fontFamily: typography.display.lg.fontFamily,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.body.tagline.fontSize,
    fontWeight: typography.body.tagline.fontWeight,
    color: typography.body.tagline.color,
    textAlign: "center",
    marginTop: -space.md,
  },
  sessionContainer: {
    flexGrow: 1,
    justifyContent: "center",
    gap: space.lg,
    padding: space.xxl,
  },
  sessionTitle: {
    fontSize: typography.heading.sm.fontSize,
    fontWeight: typography.heading.sm.fontWeight,
    color: colors.text.primary,
  },
  sessionBody: {
    fontSize: typography.body.tagline.fontSize,
    color: colors.text.secondary,
  },
});
