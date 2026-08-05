// T012 (FR-001, FR-003): thin glue only — renders RegistrationForm (T011), calls
// submitPersonalRegistration (src/domain/registration.ts, T006) on a valid submit, and
// navigates to verify-phone on success. All validation/request-building/error-interpretation
// logic lives in src/domain (Constitution IV); this screen only wires it to the router.
//
// T033 (2026-08-04, found by code-reviewer's second review, Finding 1 BLOCKING): calls
// setCurrentUserId(user.id) (src/lib/api.ts) once, right after a successful registration
// response — this is the one place a real backend User.id is genuinely confirmed (the backend
// just created it and returned it), as opposed to the Supabase authProviderId `signIn`
// establishes below, which is a different identifier entirely. Set unconditionally, before the
// sessionError branch, so it also covers the T031 sign-in-retry path: retrySignIn never
// re-calls submitPersonalRegistration/submitBusinessRegistration, so by the time a user recovers
// via "Retry sign-in" this id is already in place from the original registration call. Every
// subsequent authenticated call this JS session makes to /identity/me/* or /identity/phone/*
// (verify-phone.tsx, profile.tsx, useKycGate.ts's fetchCurrentUser) depends on this — see
// src/lib/api.ts's file-level comment for the mechanism itself, and useKycGate.ts for where the
// matching clear-on-sign-out happens. Do not add a second setCurrentUserId call site elsewhere
// (tasks.md's explicit "do not spread this" constraint) — this one call, placed here, covers
// every downstream screen in this feature for the rest of the JS session.
//
// T031 (FR-001, FR-006): submitPersonalRegistration now also attempts to establish the Supabase
// session useKycGate depends on (src/domain/registration.ts's SignInWithPassword DI seam),
// wired here with the real src/lib/supabase-client.ts implementation — the same DI pattern
// already used for `api`. If that registration-succeeded-but-sign-in-failed case happens (e.g.
// the Supabase project requires email confirmation before password sign-in), the account is NOT
// re-registered (that would hit EmailTaken/UsernameTaken) — this screen instead shows an
// explicit "your account was created, but..." message with a "Retry sign-in" action that retries
// only the sign-in primitive (src/domain/registration.ts's retrySignIn), using the just-
// submitted credentials held only in this component's in-memory state (never persisted).
//
// T025 (US2, FR-003): branches on RegistrationForm's (T024) selected account type and calls
// submitBusinessRegistration instead of submitPersonalRegistration for "business" — that
// function already existed with full T031 sign-in wiring (src/domain/registration.ts, added
// alongside submitPersonalRegistration in T006/Run 4), so no changes were needed there; this
// screen only needed to start calling it.
//
// T026 (US2): after a successful registration, this screen caches the returned `isBusiness` flag
// into the SAME React Query cache entry useKycGate.ts (T010) reads/writes under
// `currentUserQueryKey` — this is the "cleanest source" for ProfileForm/profile.tsx (T026) to
// later read `isBusiness` from, per that task's instruction not to pass it through navigation
// params. It is genuinely on the fetched User record (not re-derived/guessed), and reusing the
// same shared key is exactly what useKycGate.ts's own file-level comment already anticipated
// ("later, whichever screens/mutations populate the fuller profile ... this hook's read side is
// forward-compatible with it via the shared query key"). Known limitation, consistent with this
// feature's other already-documented X-User-Id/cold-boot gaps: this only survives within the
// same JS session — the backend's only "returning user" endpoint (GET /identity/me/kyc-status)
// does not return isBusiness, so a genuine cold-boot resumability case (profile step reached via
// a fresh app restart) has no real value to read here yet; see app/(auth)/profile.tsx (T026) for
// the safe personal-schema fallback that applies in that case.
import { useState } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  mapRegistrationError,
  retrySignIn,
  submitBusinessRegistration,
  submitPersonalRegistration,
  type RegistrationFieldError,
} from "@/domain/registration";
import type { PersonalRegistrationInput } from "@/domain/schemas";
import { RegistrationForm, type AccountType } from "@/features/identity/RegistrationForm";
import { currentUserQueryKey } from "@/features/identity/useKycGate";
import { api, setCurrentUserId } from "@/lib/api";
import { signInWithPassword } from "@/lib/supabase-client";

interface SessionIssue {
  email: string;
  password: string;
  message: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<RegistrationFieldError | undefined>();
  const [sessionIssue, setSessionIssue] = useState<SessionIssue | undefined>();
  const [isRetryingSignIn, setIsRetryingSignIn] = useState(false);

  async function handleSubmit(input: PersonalRegistrationInput, accountType: AccountType) {
    setServerError(undefined);
    setIsSubmitting(true);
    try {
      const submitRegistration =
        accountType === "business" ? submitBusinessRegistration : submitPersonalRegistration;
      const { user, sessionError } = await submitRegistration(api, signInWithPassword, input);
      // T033: see this file's top comment — the backend User.id is genuinely confirmed the
      // moment this call resolves, independent of whether the Supabase sign-in below succeeds.
      setCurrentUserId(user.id);
      // See this file's top comment (T026) — merges into whatever's already cached under this
      // key rather than replacing it, so it never clobbers fields another call has already
      // populated (e.g. a re-submission after a sessionError retry).
      queryClient.setQueryData(currentUserQueryKey, (prev: Record<string, unknown> | undefined) => ({
        ...(prev ?? {}),
        isBusiness: user.isBusiness,
      }));
      if (sessionError) {
        setSessionIssue({ email: input.email, password: input.password, message: sessionError });
        return;
      }
      router.replace("/verify-phone");
    } catch (error) {
      setServerError(mapRegistrationError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRetrySignIn() {
    if (!sessionIssue) return;
    setIsRetryingSignIn(true);
    try {
      const { error } = await retrySignIn(signInWithPassword, sessionIssue.email, sessionIssue.password);
      if (error) {
        setSessionIssue({ ...sessionIssue, message: error });
        return;
      }
      setSessionIssue(undefined);
      router.replace("/verify-phone");
    } finally {
      setIsRetryingSignIn(false);
    }
  }

  if (sessionIssue) {
    return (
      <View style={styles.screen}>
        <View style={styles.sessionIssue} testID="registration-session-issue">
          <Text style={styles.sessionIssueTitle} accessibilityRole="header">
            Your account was created
          </Text>
          <Text style={styles.sessionIssueBody} accessibilityRole="alert">
            {`We couldn't sign you in automatically (${sessionIssue.message}). This can happen if ` +
              "your account requires email confirmation before you can sign in. Check your inbox, " +
              "then tap Retry — your registration was already successful and won't be repeated."}
          </Text>
          <Pressable
            style={[styles.button, isRetryingSignIn ? styles.buttonDisabled : null]}
            onPress={handleRetrySignIn}
            disabled={isRetryingSignIn}
            accessibilityRole="button"
            accessibilityLabel="Retry sign-in"
            accessibilityState={{ disabled: isRetryingSignIn, busy: isRetryingSignIn }}
            testID="registration-retry-sign-in-button"
          >
            <Text style={styles.buttonText}>{isRetryingSignIn ? "Retrying…" : "Retry sign-in"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <RegistrationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} serverError={serverError} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  sessionIssue: {
    width: "100%",
    maxWidth: 420,
    gap: 16,
  },
  sessionIssueTitle: {
    fontSize: 22,
    fontWeight: "600",
  },
  sessionIssueBody: {
    fontSize: 14,
    color: "#374151",
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
