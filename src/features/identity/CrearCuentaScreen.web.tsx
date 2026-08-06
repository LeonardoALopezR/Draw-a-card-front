// T017 (specs/010-registration-redesign, FR-001, FR-006, FR-016, plan.md Research Decision 1 &
// 6): web variant of `CrearCuentaScreen` — same composition (`SegmentedControl` + `UsuarioForm`/
// `TiendaForm` + shared title/subtitle chrome) and the same shared `useCrearCuentaSubmit` hook
// (this directory) as `CrearCuentaScreen.tsx`; the ONLY difference is the surrounding chrome —
// this file centers the screen in a white `bg.surface` card capped at `AUTH_CARD_MAX_WIDTH`
// (`authCardLayout.ts`, T012 — the same 660px width `/login`'s own web card already uses, per
// the design brief's explicit instruction against a one-off width) on a `bg.page` field,
// mirroring `LoginScreenChrome.web.tsx`'s identical card-over-page treatment (including the same
// `ScrollView`-not-a-plain-`flex:1`-`View` fix for a card taller than a short viewport, and the
// same `keyboardShouldPersistTaps="handled"` fix for a dead first tap on a mobile browser while a
// field's keyboard is still open).
//
// T020 (FR-012, spec.md Edge Cases, [BLOCKED-ON-015] for real network behavior only): see
// CrearCuentaScreen.tsx's identical top-comment note -- the same useNationalities() wiring,
// duplicated here rather than shared, since it's a two-line hook call, not orchestration logic
// (that already lives once in useCrearCuentaSubmit.ts, shared by both variants).
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { registrationCopy } from "@/domain/i18n/copy/registration";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { SegmentedControl } from "@/features/ui/SegmentedControl";
import { colors, radius, shadowSurface, space, typography } from "@/theme";

import { AUTH_CARD_MAX_WIDTH } from "./authCardLayout";
import { TiendaForm } from "./TiendaForm";
import { UsuarioForm } from "./UsuarioForm";
import { useCrearCuentaSubmit, type CrearCuentaTab } from "./useCrearCuentaSubmit";
import { useNationalities } from "./useNationalities";

export function CrearCuentaScreen() {
  const t = useTranslation(registrationCopy);
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

  if (sessionIssue) {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        keyboardShouldPersistTaps="handled"
        testID="crear-cuenta-session-issue"
      >
        <View style={[styles.card, shadowSurface]} testID="crear-cuenta-card">
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
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
      testID="crear-cuenta-content"
    >
      <View style={[styles.card, shadowSurface]} testID="crear-cuenta-card">
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

const CARD_PADDING = 48;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg.page,
  },
  pageContent: {
    flexGrow: 1,
    minHeight: "100vh" as unknown as number,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: AUTH_CARD_MAX_WIDTH,
    borderRadius: radius.card,
    backgroundColor: colors.bg.surface,
    padding: CARD_PADDING,
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
