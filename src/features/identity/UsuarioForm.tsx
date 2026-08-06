// T015 (specs/010-registration-redesign, FR-002, FR-013, FR-014, FR-017): the `Usuario` tab's
// full field set — every registration field AND every profile-step field shown together on one
// tab (docs/design-brief-registration-redesign.md §3), validated as one React Hook Form +
// `zodResolver(usuarioCrearCuentaSchema)` (src/domain/schemas.ts, T008) unit, matching the
// mockup's single continuous form with no visible seam between "registration fields" and
// "profile fields" (plan.md Research Decision 2). `CrearCuentaScreen` (T017) is the caller that
// splits the validated payload back into the four registration-call fields and the remainder
// (the in-memory draft) — this component itself never calls the network and never interprets an
// `ApiError` (Constitution IV), mirroring `RegistrationForm.tsx`/`ProfileForm.tsx`'s established
// conventions exactly.
//
// Field order matches the design brief §3 table exactly: Nombre(s) / Apellido paterno / Apellido
// materno (optional) / Correo electrónico / Contraseña (Clarification 1) / Usuario / Fecha de
// nacimiento (DateField, T007) / Celular / Nacionalidad (Select, T006) / CURP / RFC
// (Clarification 2 — two separate inputs, not one combined field) / the two consent checkboxes.
// Every label uses `labelCase="sentence"` (T004) — this screen's fields are sentence-case, not
// this app's usual uppercase (design brief §2).
//
// Nacionalidad seam (review note, T015): this component does NOT call `useNationalities()`
// itself — that wiring is T020's job, at the `CrearCuentaScreen`/`UsuarioForm` call-site boundary
// (out of this batch's scope). `nationalityOptions`/`nationalityLoading`/`nationalityError`/
// `onRetryNationality` are plain, caller-supplied props passed straight through to `Select`'s own
// `loading`/`error`/`onRetry` slots — this file has no knowledge of *why* the catalog is loading
// or erroring, matching `Select.types.ts`'s own documented contract. `nationalityError` is
// intentionally NOT reused as the schema-validation error for the field (see the Controller
// below): `Select`'s `error` prop also disables its trigger (correct for "the catalog failed to
// load", wrong for "you haven't picked one yet" — a plain required-field validation error must
// never lock the user out of ever opening the picker to fix it), so the two are rendered through
// two different slots.
//
// CURP/RFC are sensitive identity data (Constitution Principle III's spirit,
// docs/conventions.md's Error handling section) — this component holds them only as in-flight
// react-hook-form state and never logs them (no `console.*` anywhere in this file).
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { registrationCopy } from "@/domain/i18n/copy/registration";
import type { RegistrationFieldError } from "@/domain/registration";
import { usuarioCrearCuentaSchema, type UsuarioCrearCuentaInput } from "@/domain/schemas";
import { useTranslation } from "@/features/i18n/LocaleContext";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { Select, type SelectOption } from "@/features/ui/Select";
import { spaceKeyActivation } from "@/features/ui/webKeyActivation";
import { colors, radius, space, typography } from "@/theme";

import { DateField } from "./DateField";
import { FormField } from "./FormField";

export interface UsuarioFormProps {
  onSubmit: (input: UsuarioCrearCuentaInput) => void | Promise<void>;
  isSubmitting?: boolean;
  // The backend-derived error for the in-flight registration call, mapped upstream by
  // src/domain/registration.ts's mapRegistrationError (see CrearCuentaScreen.tsx, T017) — always
  // one of the four credential fields (email/password/phone/username), since only those reach
  // the registration call this error comes from. This component only renders it.
  serverError?: RegistrationFieldError;
  // See this file's top comment — plain pass-through props for the Nacionalidad picker, wired to
  // useNationalities() by a later task (T020), not this one.
  nationalityOptions?: SelectOption[];
  nationalityLoading?: boolean;
  nationalityError?: string;
  onRetryNationality?: () => void;
}

const DEFAULT_VALUES: Partial<UsuarioCrearCuentaInput> = {
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  email: "",
  password: "",
  username: "",
  phone: "",
  nationality: "",
  curp: "",
  rfc: "",
  tosAccepted: false as unknown as true,
  privacyAccepted: false as unknown as true,
};

export function UsuarioForm({
  onSubmit,
  isSubmitting = false,
  serverError,
  nationalityOptions = [],
  nationalityLoading = false,
  nationalityError,
  onRetryNationality,
}: UsuarioFormProps) {
  const t = useTranslation(registrationCopy);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UsuarioCrearCuentaInput>({
    resolver: zodResolver(usuarioCrearCuentaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Feeds a backend-reported field error (e.g. a duplicate email/username) into the same
  // inline-error slot a client-side validation failure would use, mirroring
  // RegistrationForm.tsx's identical pattern.
  useEffect(() => {
    if (serverError?.field) {
      setError(serverError.field, { type: "server", message: serverError.message });
    }
  }, [serverError, setError]);

  const generalError = serverError && !serverError.field ? serverError.message : undefined;
  const submit = handleSubmit((data) => onSubmit(data));

  return (
    <View style={styles.container} testID="usuario-form">
      {generalError ? (
        <Text style={styles.generalError} accessibilityRole="alert" testID="usuario-form-error">
          {generalError}
        </Text>
      ) : null}

      <FormField
        label={t("nombreLabel")}
        error={errors.nombre?.message}
        labelCase="sentence"
        testID="usuario-nombre-field"
      >
        <Controller
          control={control}
          name="nombre"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("nombreLabel")}
              placeholder={t("nombrePlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              testID="usuario-nombre-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("apellidoPaternoLabel")}
        error={errors.apellidoPaterno?.message}
        labelCase="sentence"
        testID="usuario-apellido-paterno-field"
      >
        <Controller
          control={control}
          name="apellidoPaterno"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("apellidoPaternoLabel")}
              placeholder={t("apellidoPaternoPlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              testID="usuario-apellido-paterno-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("apellidoMaternoLabel")}
        error={errors.apellidoMaterno?.message}
        labelCase="sentence"
        testID="usuario-apellido-materno-field"
      >
        <Controller
          control={control}
          name="apellidoMaterno"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value ?? ""}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("apellidoMaternoLabel")}
              placeholder={t("apellidoMaternoPlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              testID="usuario-apellido-materno-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("emailLabel")}
        error={errors.email?.message}
        labelCase="sentence"
        testID="usuario-email-field"
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
              testID="usuario-email-input"
            />
          )}
        />
      </FormField>

      {/* Clarification 1 (spec.md): added directly under the email field — no confirm-password
          input, reusing passwordSchema's existing min-8 rule verbatim. */}
      <FormField
        label={t("passwordLabel")}
        error={errors.password?.message}
        labelCase="sentence"
        testID="usuario-password-field"
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
              testID="usuario-password-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("usernameLabel")}
        error={errors.username?.message}
        labelCase="sentence"
        testID="usuario-username-field"
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
              placeholder={t("usuarioUsernamePlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="none"
              autoComplete="username-new"
              testID="usuario-username-input"
            />
          )}
        />
      </FormField>

      {/* Clarification 4: a real date-picker control (DateField, T007) — already renders its own
          label/error internally, so it is not nested inside a second FormField wrapper. */}
      <Controller
        control={control}
        name="birthDate"
        render={({ field }) => (
          <DateField
            label={t("birthDateLabel")}
            value={field.value}
            onChange={field.onChange}
            error={errors.birthDate?.message}
            placeholder={t("birthDatePlaceholder")}
            labelCase="sentence"
            confirmLabel={t("dateConfirmLabel")}
            closeAccessibilityLabel={t("selectCloseAccessibilityLabel")}
            testID="usuario-birth-date"
          />
        )}
      />

      <FormField
        label={t("phoneLabel")}
        error={errors.phone?.message}
        labelCase="sentence"
        testID="usuario-phone-field"
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
              testID="usuario-phone-input"
            />
          )}
        />
      </FormField>

      {/* FR-012: a catalog picker, not free text (see this file's top comment for the
          nationalityError-vs-validation-error split). */}
      <Controller
        control={control}
        name="nationality"
        render={({ field }) => (
          <>
            <Select
              options={nationalityOptions}
              value={field.value}
              onChange={field.onChange}
              label={t("nationalityLabel")}
              placeholder={t("nationalityPlaceholder")}
              loading={nationalityLoading}
              error={nationalityError}
              onRetry={onRetryNationality}
              labelCase="sentence"
              retryLabel={t("selectRetryLabel")}
              searchPlaceholder={t("selectSearchPlaceholder")}
              loadingLabel={t("selectLoadingLabel")}
              filterAccessibilityLabel={t("selectFilterAccessibilityLabel")}
              closeAccessibilityLabel={t("selectCloseAccessibilityLabel")}
              testID="usuario-nationality"
            />
            {!nationalityError && errors.nationality?.message ? (
              <Text style={styles.error} accessibilityRole="alert" testID="usuario-nationality-error">
                {errors.nationality.message}
              </Text>
            ) : null}
          </>
        )}
      />

      {/* Clarification 2: two separate inputs, not the mockup's one combined field. */}
      <FormField
        label={t("curpLabel")}
        error={errors.curp?.message}
        labelCase="sentence"
        testID="usuario-curp-field"
      >
        <Controller
          control={control}
          name="curp"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel={t("curpLabel")}
              placeholder={t("curpPlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="characters"
              autoCorrect={false}
              testID="usuario-curp-input"
            />
          )}
        />
      </FormField>

      <FormField
        label={t("rfcLabel")}
        error={errors.rfc?.message}
        labelCase="sentence"
        testID="usuario-rfc-field"
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
              placeholder={t("rfcPlaceholder")}
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="characters"
              autoCorrect={false}
              testID="usuario-rfc-input"
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
            // See RegistrationForm.tsx's account-type radios for the full explanation of why
            // aria-checked is needed alongside accessibilityState.checked on this repo's pinned
            // react-native-web version.
            aria-checked={!!field.value}
            accessibilityState={{ checked: !!field.value, disabled: isSubmitting }}
            // FR-015: role="checkbox" silently drops Space-key activation on this repo's pinned
            // react-native-web (see src/features/ui/webKeyActivation.ts's top comment) — Enter
            // already works without this.
            {...spaceKeyActivation(
              () => field.onChange((!field.value) as unknown as true),
              isSubmitting,
            )}
            testID="usuario-tos-checkbox"
          >
            <View style={[styles.checkbox, field.value ? styles.checkboxChecked : null]} />
            <Text style={styles.checkboxLabel}>{t("tosConsentLabel")}</Text>
          </Pressable>
        )}
      />
      {errors.tosAccepted?.message ? (
        <Text style={styles.error} accessibilityRole="alert" testID="usuario-tos-error">
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
            testID="usuario-privacy-checkbox"
          >
            <View style={[styles.checkbox, field.value ? styles.checkboxChecked : null]} />
            <Text style={styles.checkboxLabel}>{t("privacyConsentLabel")}</Text>
          </Pressable>
        )}
      />
      {errors.privacyAccepted?.message ? (
        <Text style={styles.error} accessibilityRole="alert" testID="usuario-privacy-error">
          {errors.privacyAccepted.message}
        </Text>
      ) : null}

      <PrimaryButton
        label={isSubmitting ? t("submitBusyLabel") : t("submitLabel")}
        onPress={submit}
        busy={isSubmitting}
        testID="usuario-submit-button"
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
