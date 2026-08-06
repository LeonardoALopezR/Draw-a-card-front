// 010-registration-redesign T017 (FR-001, FR-006, FR-008, FR-009, plan.md Research Decision 1):
// the submit/draft-write orchestration `CrearCuentaScreen.tsx`/`CrearCuentaScreen.web.tsx` both
// need. Factored into one hook rather than duplicated across the two platform-split screen
// files — those two files differ only in their surrounding chrome (mobile single column vs. a
// centered web card, mirroring `LoginScreenChrome.tsx`/`.web.tsx`'s own mobile/web split), and
// duplicating this hook's ~60 lines of network/state orchestration across both would risk a
// silent drift between platforms (e.g. one variant fixing a bug the other doesn't get). Hooks
// colocated beside the feature that owns them is this repo's own established convention
// (docs/conventions.md), not a new mechanism.
//
// This is the exact registration-submit/session-issue/retry-sign-in mechanism
// `app/(auth)/register.tsx` already established (001-registration-kyc T031/T033), moved into
// this screen's new home per plan.md's Project Structure comment ("CrearCuentaScreen.tsx ...
// owns the submit/draft-write orchestration") — T018 (rewriting `register.tsx` to render
// `CrearCuentaScreen`, out of this batch's scope) is what deletes the now-superseded copy from
// `register.tsx` once this lands; until then this hook exists but nothing in `app/` calls it yet.
//
// Every value collected beyond the four registration-call fields (name/birth date/nationality/
// CURP/RFC on the Usuario tab, or the three business fields on the Tienda tab) is written to the
// in-memory-only registration draft (`src/lib/registration-draft.ts`, T009) UNCONDITIONALLY,
// before checking `sessionError` — registration itself already succeeded in both the happy path
// and the sessionIssue path (the account exists either way), so the draft must be in place for
// `verify-phone.tsx`'s auto-submit branch (T019) to have something to consume once the user
// actually reaches `/verify-phone` — immediately on the happy path, or after a later successful
// "Retry sign-in". The draft also now carries the submitted `email` (T019, Run 5 review Finding
// 2) — see `registration-draft.ts`'s own doc comment for why: it is the key `verify-phone.tsx`
// uses to refuse a stale draft left behind by an earlier, abandoned `sessionIssue` attempt.
import { useState } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import {
  mapRegistrationError,
  retrySignIn,
  submitBusinessRegistration,
  submitPersonalRegistration,
  type RegistrationFieldError,
  type RegistrationResult,
} from "@/domain/registration";
import type { TiendaCrearCuentaInput, UsuarioCrearCuentaInput } from "@/domain/schemas";
import { api, setCurrentUserId } from "@/lib/api";
import { setRegistrationDraft, type RegistrationDraft } from "@/lib/registration-draft";
import { signInWithPassword } from "@/lib/supabase-client";

import { currentUserQueryKey } from "./useKycGate";

export type CrearCuentaTab = "usuario" | "tienda";

export interface SessionIssue {
  email: string;
  password: string;
  message: string;
}

export function useCrearCuentaSubmit() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<CrearCuentaTab>("usuario");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<RegistrationFieldError | undefined>();
  const [sessionIssue, setSessionIssue] = useState<SessionIssue | undefined>();
  const [isRetryingSignIn, setIsRetryingSignIn] = useState(false);

  // Shared by handleUsuarioSubmit/handleTiendaSubmit below — see this file's top comment for why
  // the draft is written unconditionally, before the sessionError branch.
  function completeRegistration(
    result: RegistrationResult,
    credentials: { email: string; password: string },
    draft: RegistrationDraft
  ) {
    // T033 (001-registration-kyc): the backend User.id is genuinely confirmed the moment this
    // call resolves, independent of whether the Supabase sign-in below succeeds.
    setCurrentUserId(result.user.id);
    // T026 (001-registration-kyc): merges into whatever's already cached under this key rather
    // than replacing it, so it never clobbers a field another call already populated.
    queryClient.setQueryData(currentUserQueryKey, (prev: Record<string, unknown> | undefined) => ({
      ...(prev ?? {}),
      isBusiness: result.user.isBusiness,
    }));
    setRegistrationDraft(draft);
    if (result.sessionError) {
      setSessionIssue({ ...credentials, message: result.sessionError });
      return;
    }
    router.replace("/verify-phone");
  }

  // FR-001, FR-002: splits the Usuario tab's combined, validated payload back into the four
  // credential fields (the only ones the real POST /identity/register accepts today) and the
  // remainder (the draft) — a plain object destructure, no new domain function needed for the
  // split itself (plan.md Research Decision 2).
  async function handleUsuarioSubmit(input: UsuarioCrearCuentaInput) {
    setServerError(undefined);
    setIsSubmitting(true);
    try {
      const { email, password, phone, username, ...profile } = input;
      const result = await submitPersonalRegistration(api, signInWithPassword, {
        email,
        password,
        phone,
        username,
      });
      completeRegistration(
        result,
        { email, password },
        {
          kind: "personal",
          email,
          nombre: profile.nombre,
          apellidoPaterno: profile.apellidoPaterno,
          apellidoMaterno: profile.apellidoMaterno,
          birthDate: profile.birthDate,
          nationality: profile.nationality,
          curp: profile.curp,
          rfc: profile.rfc,
          tosAccepted: profile.tosAccepted,
          privacyAccepted: profile.privacyAccepted,
        }
      );
    } catch (error) {
      setServerError(mapRegistrationError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  // FR-001, FR-003: same split as handleUsuarioSubmit above, for the Tienda tab's shorter field
  // set (no personal-account field anywhere in the resulting draft — design brief §4).
  async function handleTiendaSubmit(input: TiendaCrearCuentaInput) {
    setServerError(undefined);
    setIsSubmitting(true);
    try {
      const { email, password, phone, username, ...profile } = input;
      const result = await submitBusinessRegistration(api, signInWithPassword, {
        email,
        password,
        phone,
        username,
      });
      completeRegistration(
        result,
        { email, password },
        {
          kind: "business",
          email,
          commercialName: profile.commercialName,
          rfc: profile.rfc,
          fiscalAddress: profile.fiscalAddress,
          tosAccepted: profile.tosAccepted,
          privacyAccepted: profile.privacyAccepted,
        }
      );
    } catch (error) {
      setServerError(mapRegistrationError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  // T031 (001-registration-kyc): retries ONLY the sign-in primitive — the account already
  // exists, so re-calling submitPersonalRegistration/submitBusinessRegistration would hit
  // EmailTaken/UsernameTaken. The draft written by completeRegistration above is untouched here
  // (still in memory, waiting for verify-phone.tsx to consume it, T019, out of this batch).
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

  return {
    tab,
    setTab,
    isSubmitting,
    serverError,
    sessionIssue,
    isRetryingSignIn,
    handleUsuarioSubmit,
    handleTiendaSubmit,
    handleRetrySignIn,
  };
}
