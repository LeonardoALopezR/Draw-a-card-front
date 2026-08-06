// specs/008-scan-experience/tasks.md T013 (US2, FR-007, FR-009): the ONLY RN-dependent layer in
// this feature's found-card state machine — a `useState<FoundCardState | null>` hook that thinly
// wraps `src/domain/scanResults.ts`'s (T002) pure functions. No transition rule is duplicated
// here: every state change delegates to a T002 export. Mirrors `006-visual-identity`'s
// `translate()`/`LocaleContext` split between portable logic and its RN wrapper (plan.md's
// Research Decisions).
//
// `ScanShellScreen.tsx` (mobile, T018) and `ScanShellScreen.web.tsx` (web, T021) both call this
// one hook so the found-state loop behaves identically regardless of which platform/trigger
// (button, search-submit, dropzone-tap) started it (spec.md User Story 2). Zero camera-module
// import, zero backend call, zero persisted storage (FR-016) — `result` lives only in this
// component-local `useState` and is gone on unmount/navigation away, matching spec.md's Edge
// Cases ("no last-found-card persistence").
import { useCallback, useEffect, useRef, useState } from "react";

import {
  advanceToNextCard,
  decrementQuantity,
  incrementQuantity,
  SAMPLE_CARDS,
  selectCondition,
  startFoundState,
  toggleGraded,
  type ConditionOption,
  type FoundCardState,
} from "@/domain/scanResults";

// FR-009: "Aceptar" gives a brief, VISIBLE local confirmation before returning to idle — never a
// silent no-op. This is the only new (non-domain) constant this hook introduces; it governs
// nothing about the found-card data itself, only how long the confirming flag stays true.
const ACCEPT_CONFIRMATION_MS = 1200;

export interface UseScanSimulationResult {
  /** `null` = idle (no found card); non-null = the active found-card state (T002). */
  result: FoundCardState | null;
  /** True for a brief window after `acceptCard()` fires, then both this and `result` clear. */
  confirming: boolean;
  /** Idle -> found, seeded from the first sample card (FR-007). */
  triggerScan: () => void;
  /** "Cambiar" -> the next sample card, re-seeded to that card's own defaults (FR-009). */
  changeCard: () => void;
  /** "Eliminar" -> back to idle (FR-009). */
  removeCard: () => void;
  /** "Aceptar" -> a brief confirming state, then idle. No network call, no storage write (FR-009). */
  acceptCard: () => void;
  selectCondition: (condition: ConditionOption) => void;
  toggleGraded: () => void;
  incrementQuantity: () => void;
  decrementQuantity: () => void;
}

export function useScanSimulation(): UseScanSimulationResult {
  const [result, setResult] = useState<FoundCardState | null>(null);
  const [confirming, setConfirming] = useState(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Never leaves a pending timer running past unmount (e.g. the user navigates away from
  // Escanear mid-confirmation via the shell — spec.md's Edge Cases).
  useEffect(
    () => () => {
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    },
    []
  );

  const triggerScan = useCallback(() => {
    setResult(startFoundState(SAMPLE_CARDS[0]));
  }, []);

  const changeCard = useCallback(() => {
    setResult((current) => (current ? advanceToNextCard(current) : current));
  }, []);

  const removeCard = useCallback(() => {
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
    setConfirming(false);
    setResult(null);
  }, []);

  const acceptCard = useCallback(() => {
    setConfirming(true);
    confirmTimeoutRef.current = setTimeout(() => {
      confirmTimeoutRef.current = null;
      setConfirming(false);
      setResult(null);
    }, ACCEPT_CONFIRMATION_MS);
  }, []);

  const handleSelectCondition = useCallback((condition: ConditionOption) => {
    setResult((current) => (current ? selectCondition(current, condition) : current));
  }, []);

  const handleToggleGraded = useCallback(() => {
    setResult((current) => (current ? toggleGraded(current) : current));
  }, []);

  const handleIncrementQuantity = useCallback(() => {
    setResult((current) => (current ? incrementQuantity(current) : current));
  }, []);

  const handleDecrementQuantity = useCallback(() => {
    setResult((current) => (current ? decrementQuantity(current) : current));
  }, []);

  return {
    result,
    confirming,
    triggerScan,
    changeCard,
    removeCard,
    acceptCard,
    selectCondition: handleSelectCondition,
    toggleGraded: handleToggleGraded,
    incrementQuantity: handleIncrementQuantity,
    decrementQuantity: handleDecrementQuantity,
  };
}
