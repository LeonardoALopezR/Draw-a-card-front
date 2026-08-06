// T016 (specs/010-registration-redesign, FR-003): the `Tienda` tab's full field set — SAME
// conventions as UsuarioForm.tsx (T015), `zodResolver(tiendaCrearCuentaSchema)`
// (src/domain/schemas.ts, T008) validating the whole visible form as one unit. Renders EXACTLY
// the design brief §4 field list: Nombre comercial, Correo electrónico, Contraseña
// (Clarification 1), Usuario, RFC (ordinary styling — no `(PLD)` suffix, Clarification 3),
// Celular, Domicilio fiscal, the two consent checkboxes. `CrearCuentaScreen` (T017) is the
// caller that splits the validated payload back into the four registration-call fields and the
// remainder (the in-memory draft) — this component itself never calls the network.
//
// NO PERSONAL-ACCOUNT FIELD ANYWHERE IN THIS FILE (FR-003 — a real, deliberate divergence from
// today's backend contract, decided in the backend's favor per design brief §7.6): no name, no
// birth date, no nationality, no CURP. `TiendaForm.test.tsx` asserts this negatively (no such
// field/label is ever rendered), not just positively (the fields that ARE here are correct) —
// this is the frontend half of a decision backend `015`'s User Story 2 is expected to relax
// `profileBusinessSchema` to match (see src/domain/schemas.ts's `tiendaProfileFormSchema`
// comment).
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { registrationCopy } from "@/domain/i18n/copy/registration";
import type { RegistrationFieldError } from "@/domain/registration";
import { tiendaCrearCuentaSchema, type TiendaCrearCuentaInput } from "@/domain/schemas";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { spaceKeyActivation } from "@/features/ui/webKeyActivation";
import { colors, radius, space, typography } from "@/theme";

import { FormField } from "./FormField";

export interface TiendaFormProps {
  onSubmit: (input: TiendaCrearCuentaInput) => void | Promise<void>;
  isSubmitting?: boolean;
  // The backend-derived error for the in-flight registration call, mapped upstream by
  // src/domain/registration.ts's mapRegistrationError (see CrearCuentaScreen.tsx, T017) — always
  // one of the four credential fields (email/password/phone/username). This component only
  // renders it.
  serverError?: RegistrationFieldError;
}

const DEFAULT_VALUES: TiendaCrearCuentaInput = {
  commercialName: "",
  email: "",
  password: "",
  username: "",
  rfc: "",
  phone: "",
  fiscalAddress: "",
  tosAccepted: false as unknown as true,
  privacyAccepted: false as unknown as true,
};

export function TiendaForm({ onSubmit, isSubmitting = false, serverError }: TiendaFormProps) {
  const t = useTranslation(registrationCopy);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TiendaCrearCuentaInput>({
    resolver: zodResolver(tiendaCrearCuentaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (serverError?.field) {
      setError(serverError.field, { type: "server", message: serverError.message });
    }
  }, [serverError, setError]);

  const generalError = serverError && !serverError.field ? serverError.message : undefined;
  const submit = handleSubmit((data) => onSubmit(data));

  return (
    <View style={styles.container} testID="tienda-form">
      {generalError ? (
        <Text style={styles.generalError} accessibilityRole="alert" testID="tienda-form-error">
          {generalError}
        </Text>
      ) : null}

      <FormField
        label={t("commercialNameLabel")}
        error={errors.commercialName?.message}
        labelCase="sentence"
        testID="tienda-commercial-name-field"
      >
        <Controller
          control={control}
          name="commercialName"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("commercialNameLabel")}
              placeholder={t("commercialNamePlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              testID="tienda-commercial-name-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("emailLabel")}
        error={errors.email?.message}
        labelCase="sentence"
        testID="tienda-email-field"
      >
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("emailLabel")}
              placeholder={t("emailPlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="tienda-email-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("passwordLabel")}
        error={errors.password?.message}
        labelCase="sentence"
        testID="tienda-password-field"
      >
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("passwordLabel")}
              autoComplete="password-new"
              secureTextEntry
              testID="tienda-password-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("usernameLabel")}
        error={errors.username?.message}
        labelCase="sentence"
        testID="tienda-username-field"
      >
        <Controller
          control={control}
          name="username"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("usernameLabel")}
              placeholder={t("tiendaUsernamePlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="none"
              autoComplete="username-new"
              testID="tienda-username-input"
            />
          )}
        />
      </FormField>

      {/* Clarification 3: ordinary field styling — no `(PLD)` suffix, no blue treatment (the
          banner it would point back to is out of scope, design brief §6/§7.5). */}
      <FormField
        label={t("rfcLabel")}
        error={errors.rfc?.message}
        labelCase="sentence"
        testID="tienda-rfc-field"
      >
        <Controller
          control={control}
          name="rfc"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("rfcLabel")}
              placeholder={t("tiendaRfcPlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="characters"
              autoCorrect={false}
              testID="tienda-rfc-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("phoneLabel")}
        error={errors.phone?.message}
        labelCase="sentence"
        testID="tienda-phone-field"
      >
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("phoneLabel")}
              placeholder={t("phonePlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              autoComplete="tel"
              keyboardType="phone-pad"
              testID="tienda-phone-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("fiscalAddressLabel")}
        error={errors.fiscalAddress?.message}
        labelCase="sentence"
        testID="tienda-fiscal-address-field"
      >
        <Controller
          control={control}
          name="fiscalAddress"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("fiscalAddressLabel")}
              placeholder={t("fiscalAddressPlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              testID="tienda-fiscal-address-input"
            />
          )}
        />
      </FormField>

      <Controller
        control={control}
        name="tosAccepted"
        render={({ field }) => (
          <Pressable
            style={styles.checkboxRow}
            onPress={() => field.onChange((!field.value) as unknown as true)}
            disabled={isSubmitting}
            accessibilityRole="checkbox"
            accessibilityLabel={t("tosConsentLabel")}
            aria-checked={!!field.value}
            accessibilityState={{ checked: !!field.value, disabled: isSubmitting }}
            // FR-015: role="checkbox" silently drops Space-key activation on this repo's pinned
            // react-native-web (see src/features/ui/webKeyActivation.ts's top comment) — Enter
            // already works without this.
            {...spaceKeyActivation(
              () => field.onChange((!field.value) as unknown as true),
              isSubmitting,
            )}
            testID="tienda-tos-checkbox"
          >
            <View style={[styles.checkbox, field.value ? styles.checkboxChecked : null]} />
            <Text style={styles.checkboxLabel}>{t("tosConsentLabel")}</Text>
          </Pressable>
        )}
      />
      {errors.tosAccepted?.message ? (
        <Text style={styles.error} accessibilityRole="alert" testID="tienda-tos-error">
          {errors.tosAccepted.message}
        </Text>
      ) : null}

      <Controller
        control={control}
        name="privacyAccepted"
        render={({ field }) => (
          <Pressable
            style={styles.checkboxRow}
            onPress={() => field.onChange((!field.value) as unknown as true)}
            disabled={isSubmitting}
            accessibilityRole="checkbox"
            accessibilityLabel={t("privacyConsentLabel")}
            aria-checked={!!field.value}
            accessibilityState={{ checked: !!field.value, disabled: isSubmitting }}
            {...spaceKeyActivation(
              () => field.onChange((!field.value) as unknown as true),
              isSubmitting,
            )}
            testID="tienda-privacy-checkbox"
          >
            <View style={[styles.checkbox, field.value ? styles.checkboxChecked : null]} />
            <Text style={styles.checkboxLabel}>{t("privacyConsentLabel")}</Text>
          </Pressable>
        )}
      />
      {errors.privacyAccepted?.message ? (
        <Text style={styles.error} accessibilityRole="alert" testID="tienda-privacy-error">
          {errors.privacyAccepted.message}
        </Text>
      ) : null}

      <PrimaryButton
        label={isSubmitting ? t("submitBusyLabel") : t("submitLabel")}
        onPress={submit}
        busy={isSubmitting}
        testID="tienda-submit-button"
      />
    </View>
  );
}

// Minimum 44x44 tap targets (Constitution VII, FR-015) on every interactive element; single
// narrow column, unmodified at a 375px-wide web viewport through tablet/desktop widths.
const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: space.lg,
  },
  generalError: {
    fontSize: 14,
    color: colors.text.danger,
  },
  input: {
    fontSize: typography.body.input.fontSize,
    fontWeight: typography.body.input.fontWeight,
    color: colors.text.primary,
    padding: 0,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    gap: space.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.input,
  },
  checkboxChecked: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  checkboxLabel: {
    fontSize: typography.body.tagline.fontSize,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  error: {
    fontSize: 13,
    color: colors.text.danger,
  },
});
