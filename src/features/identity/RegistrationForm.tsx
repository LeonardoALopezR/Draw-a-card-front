// T011 (FR-001, FR-003, FR-005): personal-account fields only — email, password, phone,
// username. Business-specific fields (commercial name, RFC, fiscal address) are NOT collected
// here; the 2026-08-04 re-scope moved them to the profile step (ProfileForm, T016/T026) — see
// spec.md's Clarifications finding 4. All validation lives in `personalRegistrationSchema`
// (src/domain/schemas.ts) via React Hook Form's zodResolver — this component only renders the
// fields and reports a valid submission upward; it does not construct a request, transform the
// payload, or itself interpret an ApiError (Constitution IV). Establishes this feature's form
// conventions (see src/features/identity/FormField.tsx): a shared FormField wrapper for
// label/inline-error layout, inline errors only (never an alert/full-screen replacement,
// SC-002), and a `serverError` prop as the one channel by which a screen feeds a backend error
// back into the form (see app/(auth)/register.tsx, T012).
//
// T024 (US2, FR-003): adds the personal/business account-type toggle. This ONLY selects which
// registration endpoint app/(auth)/register.tsx (T025) calls — it does not reveal any new
// fields on this screen (business fields moved to the profile step, T026). `accountType` is
// plain React local UI state (Constitution: local/UI state via React state, not React Hook
// Form/Zod) since the backend's registerCredentialsSchema has no corresponding field — it is
// encoded entirely by which of the two endpoints is called, not by a request-body value (see
// src/domain/schemas.ts's doc comment on businessRegistrationSchema). Rendered as an accessible
// `radiogroup`/`radio` pair (keyboard-operable via the same Pressable pattern already used for
// this form's submit button and ProfileForm's checkboxes) rather than a native picker, so it
// works identically across web/iOS/Android without a new dependency.
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { RegistrationFieldError } from "@/domain/registration";
import { personalRegistrationSchema, type PersonalRegistrationInput } from "@/domain/schemas";

import { FormField } from "./FormField";

export type AccountType = "personal" | "business";

export interface RegistrationFormProps {
  onSubmit: (input: PersonalRegistrationInput, accountType: AccountType) => void | Promise<void>;
  isSubmitting?: boolean;
  // The backend-derived error for the in-flight submission, mapped upstream by
  // src/domain/registration.ts's mapRegistrationError (see app/(auth)/register.tsx, T012) —
  // this component only renders it, it never calls the API or interprets an ApiError code
  // itself.
  serverError?: RegistrationFieldError;
}

const DEFAULT_VALUES: PersonalRegistrationInput = {
  email: "",
  password: "",
  phone: "",
  username: "",
};

export function RegistrationForm({ onSubmit, isSubmitting = false, serverError }: RegistrationFormProps) {
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PersonalRegistrationInput>({
    resolver: zodResolver(personalRegistrationSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Feeds a backend-reported field error (e.g. a duplicate email/username, FR-005) into the
  // same inline-error slot a client-side validation failure would use, so the user sees one
  // consistent error presentation regardless of whether the failure was caught client-side or
  // server-side.
  useEffect(() => {
    if (serverError?.field) {
      setError(serverError.field, { type: "server", message: serverError.message });
    }
  }, [serverError, setError]);

  const generalError = serverError && !serverError.field ? serverError.message : undefined;
  const submit = handleSubmit((data) => onSubmit(data, accountType));

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Create your account
      </Text>

      {generalError ? (
        <Text style={styles.generalError} accessibilityRole="alert" testID="registration-form-error">
          {generalError}
        </Text>
      ) : null}

      <View style={styles.field} accessibilityRole="radiogroup" testID="registration-account-type-field">
        <Text style={styles.label}>Account type</Text>
        <View style={styles.accountTypeRow}>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Personal account"
            // Also set as the top-level `aria-checked` prop, not just accessibilityState.checked:
            // this repo's pinned react-native-web version (0.19.13) does not forward
            // `accessibilityState` to the DOM at all (confirmed by inspecting
            // node_modules/react-native-web/src/modules/forwardedProps — accessibilityState is
            // absent from its allowlist), so `accessibilityState={{ checked }}` alone produces no
            // `aria-checked` attribute on web — a screen-reader user could not tell which account
            // type was selected, since selection was otherwise conveyed only visually (the
            // background-color style below). `aria-checked` IS in that allowlist and is forwarded
            // verbatim, and React Native's own Pressable (native) merges a top-level `aria-checked`
            // prop into its internal accessibilityState.checked
            // (node_modules/react-native/Libraries/Components/Pressable/Pressable.js), so this one
            // prop is correct and sufficient on both web and native — accessibilityState.checked is
            // kept alongside it only for the (Jest/RNTL) test environment, which reads
            // accessibilityState directly rather than resolved DOM attributes.
            aria-checked={accountType === "personal"}
            accessibilityState={{ checked: accountType === "personal", disabled: isSubmitting }}
            onPress={() => setAccountType("personal")}
            disabled={isSubmitting}
            style={[styles.accountTypeOption, accountType === "personal" ? styles.accountTypeOptionSelected : null]}
            testID="registration-account-type-personal"
          >
            <Text
              style={[
                styles.accountTypeOptionText,
                accountType === "personal" ? styles.accountTypeOptionTextSelected : null,
              ]}
            >
              Personal
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Tienda (business) account"
            // See the "Personal account" radio's comment above — same aria-checked fix.
            aria-checked={accountType === "business"}
            accessibilityState={{ checked: accountType === "business", disabled: isSubmitting }}
            onPress={() => setAccountType("business")}
            disabled={isSubmitting}
            style={[styles.accountTypeOption, accountType === "business" ? styles.accountTypeOptionSelected : null]}
            testID="registration-account-type-business"
          >
            <Text
              style={[
                styles.accountTypeOptionText,
                accountType === "business" ? styles.accountTypeOptionTextSelected : null,
              ]}
            >
              Tienda
            </Text>
          </Pressable>
        </View>
      </View>

      <FormField label="Email" error={errors.email?.message} testID="registration-email-field">
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
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="registration-email-input"
            />
          )}
        />
      </FormField>

      <FormField label="Password" error={errors.password?.message} testID="registration-password-field">
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
              accessibilityLabel="Password"
              autoComplete="password-new"
              secureTextEntry
              testID="registration-password-input"
            />
          )}
        />
      </FormField>

      <FormField label="Phone" error={errors.phone?.message} testID="registration-phone-field">
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
              accessibilityLabel="Phone"
              autoComplete="tel"
              keyboardType="phone-pad"
              testID="registration-phone-input"
            />
          )}
        />
      </FormField>

      <FormField label="Username" error={errors.username?.message} testID="registration-username-field">
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
              accessibilityLabel="Username"
              autoCapitalize="none"
              autoComplete="username-new"
              testID="registration-username-input"
            />
          )}
        />
      </FormField>

      <Pressable
        style={[styles.button, isSubmitting ? styles.buttonDisabled : null]}
        onPress={submit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Create account"
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        testID="registration-submit-button"
      >
        <Text style={styles.buttonText}>{isSubmitting ? "Creating account…" : "Create account"}</Text>
      </Pressable>
    </View>
  );
}

// Minimum 44x44 tap targets (Constitution VII, SC-003) on both the button and every text
// input; layout stays a single narrow column so it works unmodified at a 375px-wide web
// viewport through tablet/desktop widths.
const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 420,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  generalError: {
    fontSize: 14,
    color: "#dc2626",
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  accountTypeRow: {
    flexDirection: "row",
    gap: 12,
  },
  accountTypeOption: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  accountTypeOptionSelected: {
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  accountTypeOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  accountTypeOptionTextSelected: {
    color: "#ffffff",
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 8,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
