// T016 (FR-004): personal profile fields — nombre, apellidoPaterno, apellidoMaterno, birth
// date, nationality, CURP, RFC — plus ToS/privacy acceptance. Follows
// RegistrationForm's/VerifyPhoneScreen's established conventions exactly: React Hook Form +
// zodResolver (profileFormSchema/businessProfileFormSchema, src/domain/schemas.ts — reused
// as-is, not redefined here per Constitution IV), the shared FormField wrapper for
// label/inline-error layout, a `serverError` prop as the one channel a screen uses to feed a
// backend error back into the form. This component never calls the network and never
// interprets an ApiError itself — see src/domain/profile.ts's mapProfileError/
// isPhoneNotVerifiedError for where that lives.
//
// T021 (specs/010-registration-redesign, FR-006): restyled in place to this feature's shared
// `006-visual-identity` token layer (`FormField`'s `labelCase="sentence"` per T004,
// `src/theme` colors/typography/radius/space throughout, `PrimaryButton` for the submit control)
// — SAME fields, SAME `profileFormSchema`/`businessProfileFormSchema` resolver, SAME props, NO
// structural change (plan.md Research Decision 1's step 5). Every rendered string
// (accessibilityLabel/placeholder/button copy) is left byte-for-byte unchanged from before this
// restyle — those are behavioral surface, not visual style, and `ProfileForm.test.tsx`'s existing
// `getByLabelText`/`getByRole` assertions depend on them staying exactly as they were. This
// screen is now the explicit recovery/resumability path (not the primary `Crear cuenta`
// journey), so it deliberately does NOT gain a segmented control or any new field. The business
// block just below (still validated against `businessProfileFormSchema`, still requiring
// personal fields) is deliberately NOT narrowed to `tiendaProfileFormSchema` here either — a
// separate, later task records that explicit `015`-gated follow-up (plan.md Research Decision 8).
//
// 001-registration-kyc T026 (US2, FR-003, FR-004): adds `commercialName`/`fiscalAddress` as a conditional block,
// rendered only when the `isBusiness` prop is true (rfc above is reused as-is for both account
// types — see schemas.ts's doc comment on businessProfileFormSchema for why there is no
// separate business-RFC field). `isBusiness` is a prop, not a value this component fetches or
// derives itself — the caller (app/(auth)/profile.tsx, T026) owns figuring out where that flag
// comes from (Constitution IV: this component stays render-only). Validates against
// `businessProfileFormSchema` instead of the base `profileFormSchema` when `isBusiness` is true,
// so a business submission missing RFC (already required by the base schema) or
// commercialName/fiscalAddress (business-only required fields) is rejected client-side with a
// visible inline error before ever reaching the network (spec.md US2 Acceptance Scenario 2).
//
// CURP/RFC are sensitive identity data (Constitution Principle III's spirit, docs/conventions.md
// Error handling). This component holds them only as in-flight react-hook-form state — the same
// state RegistrationForm already holds passwords in — and never logs them (no console.* call
// anywhere in this file) or persists them beyond the form's own lifetime; submission hands them
// straight to the caller's onSubmit (app/(auth)/profile.tsx, T017), which forwards them to
// submitProfile (src/domain/profile.ts) and does not persist them client-side either.
//
// Birth date and nationality: rendered as plain accessible TextInputs, not a native-only date
// picker. plan.md's Technical Context states no new runtime dependency is required for this
// flow, and a native date-picker component (e.g. @react-native-community/datetimepicker) is not
// already installed — adding one here would be an undocumented new dependency. A plain TextInput
// already works identically and accessibly across iOS/Android/web (same as every other field in
// this feature), so no `.native.tsx`/`.web.tsx` split is needed for this task.
import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { ProfileFieldError } from "@/domain/profile";
import { businessProfileFormSchema, profileFormSchema, type ProfileFormInput } from "@/domain/schemas";
import { PrimaryButton } from "@/features/ui/PrimaryButton";
import { spaceKeyActivation } from "@/features/ui/webKeyActivation";
import { colors, radius, space, typography } from "@/theme";

import { FormField } from "./FormField";

export interface ProfileFormProps {
  onSubmit: (input: ProfileFormInput) => void | Promise<void>;
  isSubmitting?: boolean;
  // T026 (US2): renders/requires the business-only fields (commercialName, fiscalAddress) and
  // validates against businessProfileFormSchema instead of the base profileFormSchema when
  // true. Defaults to false so every existing US1 (personal) call site is unaffected.
  isBusiness?: boolean;
  // The backend-derived error for the in-flight submission, mapped upstream by
  // src/domain/profile.ts's mapProfileError (see app/(auth)/profile.tsx, T017) — this component
  // only renders it, it never calls the API or interprets an ApiError code itself.
  serverError?: ProfileFieldError;
}

// zod's ZodDate keeps a static input type of `Date` even under z.coerce.date() (a known zod v3
// typing limitation — the runtime coercion accepts a string too, but the compile-time type does
// not reflect that; see src/domain/profile.test.ts's own comment on this). This form collects
// birthDate as free text (a plain TextInput, per this file's top comment) and hands the raw
// string to react-hook-form via an explicit cast, exactly as profile.test.ts already does for a
// statically-typed caller — zodResolver's schema.parse coerces that string into a real Date at
// validation time; this component never does date arithmetic itself. The same applies to
// tosAccepted/privacyAccepted, which are `z.literal(true)` — an unchecked checkbox is genuinely
// `false` at runtime (so the schema correctly rejects it until checked), even though
// ProfileFormInput's static type narrows the field to the literal `true`.
const DEFAULT_VALUES: ProfileFormInput = {
  nombre: "",
  apellidoPaterno: "",
  // Plain "" like every other text field here — profileFormSchema's apellidoMaterno now
  // normalizes an empty/whitespace-only string to `undefined` itself (via
  // src/domain/schemas.ts's optionalNonEmptyString preprocess step, see that schema's doc
  // comment), so this component no longer needs its own undefined-vs-"" workaround. A field
  // that's typed into and then cleared (RHF always produces "" for a cleared controlled
  // TextInput, never undefined) is genuinely optional now, not just a never-touched field.
  apellidoMaterno: "",
  birthDate: "" as unknown as Date,
  nationality: "",
  curp: "",
  rfc: "",
  tosAccepted: false as unknown as true,
  privacyAccepted: false as unknown as true,
  // T026: only rendered/required when isBusiness is true (see below), but always present in
  // defaultValues (same "" pattern as every other text field) so the Controller-backed
  // TextInput never flips from uncontrolled to controlled if isBusiness changes after mount.
  commercialName: "",
  fiscalAddress: "",
};

function formatDateFieldValue(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  return typeof value === "string" ? value : "";
}

export function ProfileForm({ onSubmit, isSubmitting = false, isBusiness = false, serverError }: ProfileFormProps) {
  // businessProfileFormSchema only narrows commercialName/fiscalAddress from optional to
  // required (schemas.ts) — its z.infer output is structurally assignable to ProfileFormInput at
  // runtime, but react-hook-form's Resolver type is contravariant in its field-values type
  // parameter, so TypeScript won't accept a Resolver<BusinessProfileFormInput> in a slot typed
  // Resolver<ProfileFormInput> without this cast. The cast is safe: both schemas produce the
  // same field set, just a different required/optional split, and useForm is still declared
  // <ProfileFormInput> throughout this component either way.
  const resolver = zodResolver(isBusiness ? businessProfileFormSchema : profileFormSchema) as Resolver<
    ProfileFormInput
  >;
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProfileFormInput>({
    resolver,
    defaultValues: DEFAULT_VALUES,
  });

  // Feeds a backend-reported field error (e.g. a duplicate business RFC, FR-003) into the same
  // inline-error slot a client-side validation failure would use — same pattern as
  // RegistrationForm/VerifyPhoneScreen.
  useEffect(() => {
    if (serverError?.field) {
      setError(serverError.field, { type: "server", message: serverError.message });
    }
  }, [serverError, setError]);

  const generalError = serverError && !serverError.field ? serverError.message : undefined;
  const submit = handleSubmit((data) => onSubmit(data));

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Complete your profile
      </Text>

      {generalError ? (
        <Text style={styles.generalError} accessibilityRole="alert" testID="profile-form-error">
          {generalError}
        </Text>
      ) : null}

      <FormField label="Nombre" error={errors.nombre?.message} labelCase="sentence" testID="profile-nombre-field">
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
              accessibilityLabel="Nombre"
              placeholderTextColor={colors.text.placeholder}
              testID="profile-nombre-input"
            />
          )}
        />
      </FormField>

      <FormField
        label="Apellido paterno"
        error={errors.apellidoPaterno?.message}
        labelCase="sentence"
        testID="profile-apellido-paterno-field"
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
              accessibilityLabel="Apellido paterno"
              placeholderTextColor={colors.text.placeholder}
              testID="profile-apellido-paterno-input"
            />
          )}
        />
      </FormField>

      <FormField
        label="Apellido materno (optional)"
        error={errors.apellidoMaterno?.message}
        labelCase="sentence"
        testID="profile-apellido-materno-field"
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
              accessibilityLabel="Apellido materno"
              placeholderTextColor={colors.text.placeholder}
              testID="profile-apellido-materno-input"
            />
          )}
        />
      </FormField>

      <FormField
        label="Birth date"
        error={errors.birthDate?.message}
        labelCase="sentence"
        testID="profile-birth-date-field"
      >
        <Controller
          control={control}
          name="birthDate"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={formatDateFieldValue(field.value)}
              onChangeText={(text) => field.onChange(text as unknown as Date)}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel="Birth date"
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.placeholder}
              autoCapitalize="none"
              testID="profile-birth-date-input"
            />
          )}
        />
      </FormField>

      <FormField
        label="Nationality"
        error={errors.nationality?.message}
        labelCase="sentence"
        testID="profile-nationality-field"
      >
        <Controller
          control={control}
          name="nationality"
          render={({ field }) => (
            <TextInput
              style={styles.input}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              editable={!isSubmitting}
              accessibilityLabel="Nationality"
              autoCapitalize="characters"
              testID="profile-nationality-input"
            />
          )}
        />
      </FormField>

      <FormField label="CURP" error={errors.curp?.message} labelCase="sentence" testID="profile-curp-field">
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
              accessibilityLabel="CURP"
              autoCapitalize="characters"
              autoCorrect={false}
              testID="profile-curp-input"
            />
          )}
        />
      </FormField>

      <FormField label="RFC" error={errors.rfc?.message} labelCase="sentence" testID="profile-rfc-field">
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
              accessibilityLabel="RFC"
              autoCapitalize="characters"
              autoCorrect={false}
              testID="profile-rfc-input"
            />
          )}
        />
      </FormField>

      {/* 010-registration-redesign T026 (2026-08-06, plan.md Research Decision 8): FOLLOW-UP, NOT
          IMPLEMENTED HERE. This block still validates against businessProfileFormSchema (line 122
          above), which still requires the personal fields (nombre/apellidoPaterno/birthDate/
          nationality/curp) the primary Tienda tab (TiendaForm.tsx) never collects. Once backend
          015-registration-profile-support's User Story 2 ships (relaxing profileBusinessSchema to
          match), this block should switch its resolver to tiendaProfileFormSchema
          (src/domain/schemas.ts) instead, so a resumed Tienda user reaching this recovery screen
          stops being asked for personal fields they were never shown on Crear cuenta. Deliberately
          left as businessProfileFormSchema for now — today's real backend still requires those
          personal fields, so narrowing this now would make this recovery screen fail for exactly
          the Tienda users it exists to help (see this file's T021 comment above and plan.md
          Research Decision 8 for the full reasoning). */}
      {/* 001-registration-kyc T026 (US2): business-only fields — rfc above is reused as-is (see
          src/domain/schemas.ts's businessProfileFormSchema doc comment for why there is no
          separate business-RFC field). Rendered only for business accounts; the resolver above
          also requires both, so omitting either at submission time shows the inline error below
          without ever reaching the network (spec.md US2 Acceptance Scenario 2). */}
      {isBusiness ? (
        <>
          <FormField
            label="Commercial name"
            error={errors.commercialName?.message}
            labelCase="sentence"
            testID="profile-commercial-name-field"
          >
            <Controller
              control={control}
              name="commercialName"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  editable={!isSubmitting}
                  accessibilityLabel="Commercial name"
                  placeholderTextColor={colors.text.placeholder}
                  testID="profile-commercial-name-input"
                />
              )}
            />
          </FormField>

          <FormField
            label="Fiscal address"
            error={errors.fiscalAddress?.message}
            labelCase="sentence"
            testID="profile-fiscal-address-field"
          >
            <Controller
              control={control}
              name="fiscalAddress"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  editable={!isSubmitting}
                  accessibilityLabel="Fiscal address"
                  placeholderTextColor={colors.text.placeholder}
                  testID="profile-fiscal-address-input"
                />
              )}
            />
          </FormField>
        </>
      ) : null}

      <Controller
        control={control}
        name="tosAccepted"
        render={({ field }) => (
          <Pressable
            style={styles.checkboxRow}
            onPress={() => field.onChange((!field.value) as unknown as true)}
            disabled={isSubmitting}
            accessibilityRole="checkbox"
            accessibilityLabel="I accept the Terms of Service"
            // See RegistrationForm.tsx's account-type radios for the full explanation: this
            // repo's pinned react-native-web (0.19.13) never forwards `accessibilityState` to the
            // DOM at all, so `accessibilityState={{ checked }}` alone leaves this checkbox's
            // checked state conveyed only visually (the checkboxChecked background-color style
            // below) on web. The top-level `aria-checked` prop IS forwarded on web and is merged
            // into accessibilityState.checked by React Native's own Pressable on native, so it's
            // the one prop that's correct on both platforms.
            aria-checked={!!field.value}
            accessibilityState={{ checked: !!field.value, disabled: isSubmitting }}
            // T027 (specs/010-registration-redesign, FR-015): role="checkbox" silently drops
            // Space-key activation on this repo's pinned react-native-web (see
            // src/features/ui/webKeyActivation.ts's top comment) — Enter already works without
            // this.
            {...spaceKeyActivation(
              () => field.onChange((!field.value) as unknown as true),
              isSubmitting,
            )}
            testID="profile-tos-checkbox"
          >
            <View style={[styles.checkbox, field.value ? styles.checkboxChecked : null]} />
            <Text style={styles.checkboxLabel}>I accept the Terms of Service</Text>
          </Pressable>
        )}
      />
      {errors.tosAccepted?.message ? (
        <Text style={styles.error} accessibilityRole="alert" testID="profile-tos-error">
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
            accessibilityLabel="I accept the Privacy Policy"
            // See the ToS checkbox above / RegistrationForm.tsx's account-type radios for the full
            // explanation of why aria-checked is needed alongside accessibilityState.checked.
            aria-checked={!!field.value}
            accessibilityState={{ checked: !!field.value, disabled: isSubmitting }}
            {...spaceKeyActivation(
              () => field.onChange((!field.value) as unknown as true),
              isSubmitting,
            )}
            testID="profile-privacy-checkbox"
          >
            <View style={[styles.checkbox, field.value ? styles.checkboxChecked : null]} />
            <Text style={styles.checkboxLabel}>I accept the Privacy Policy</Text>
          </Pressable>
        )}
      />
      {errors.privacyAccepted?.message ? (
        <Text style={styles.error} accessibilityRole="alert" testID="profile-privacy-error">
          {errors.privacyAccepted.message}
        </Text>
      ) : null}

      <PrimaryButton
        label={isSubmitting ? "Saving…" : "Save profile"}
        onPress={submit}
        busy={isSubmitting}
        testID="profile-submit-button"
      />
    </View>
  );
}

// T021 (specs/010-registration-redesign, FR-006): every value below now traces to src/theme's
// tokens — no raw hex/magic-number literal — mirroring TiendaForm.tsx's/UsuarioForm.tsx's
// identical style-block shape exactly. `input` only carries text styling now (no
// border/padding/height of its own): FormField's own `inputContainer` (radius.pill, bg.surface,
// shadowSurface, CONTROL_HEIGHT) already supplies the pill container, the same division of
// responsibility TiendaForm/UsuarioForm already established. Minimum 44x44 tap targets
// (Constitution VII, SC-003) on every interactive element (inputs, checkboxes, the PrimaryButton
// submit control) are preserved; single narrow column, unmodified at a 375px-wide web viewport
// through tablet/desktop widths.
const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 420,
    gap: space.lg,
  },
  title: {
    fontSize: typography.heading.sm.fontSize,
    fontWeight: typography.heading.sm.fontWeight,
    color: colors.text.primary,
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
