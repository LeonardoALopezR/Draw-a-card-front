// T027 (specs/010-registration-redesign, FR-015, Constitution VII): a small, dependency-free
// helper for a second instance of a react-native-web keyboard-activation gap this repo has now
// found (the first being SegmentedControl.tsx's/UsuarioForm.tsx's `aria-checked`-forwarding fix,
// 001-registration-kyc T028) — confirmed by reading this repo's pinned react-native-web (0.19.13)
// source directly, not assumed: node_modules/react-native-web/dist/cjs/modules/usePressEvents/
// PressResponder.js's `isValidKeyPress` only treats the Space key as a valid `Pressable`
// activation key when the rendered DOM role is literally `"button"` —
// `isButtonish = getElementType(target) === 'button' || isButtonRole(target)`, where
// `isButtonRole` checks `role === 'button'` exactly. Every other interactive
// `accessibilityRole` this feature uses (`checkbox`, `radio`, `combobox`) therefore gets Enter
// for free (that branch has no role restriction) but silently drops Space — a real, reproducible-
// in-a-real-browser gap against FR-015's explicit "Enter/Space activation" requirement, not a
// theoretical one. This helper supplies exactly the missing case and nothing else: it must never
// also handle Enter, since react-native-web's own `PressResponder` already fires `onPress` for
// Enter regardless of role, and doing so here too would double-activate.
//
// Returns a plain object (`{ onKeyDown }`) rather than being spread as a literal JSX prop,
// because `onKeyDown` is not part of the `PressableProps` type this repo's pinned `react-native`
// package declares (a real `.d.ts`-level gap — react-native-web's own runtime Pressable accepts
// and forwards it, but @types/react-native's `Pressable.d.ts` has no such member). Spreading a
// variable of this return type onto a `<Pressable>` passes `tsc --noEmit` because TypeScript's
// excess-property check only applies to object *literals* written directly in JSX attribute
// position, not to a spread of a differently-shaped variable — confirmed against this repo's own
// tsconfig before use, not assumed. This keeps strict mode intact with no `@ts-ignore`/`any`
// widening (docs/conventions.md), the same way this repo already ships `aria-checked`/
// `aria-expanded` as extra top-level props alongside `accessibilityState` elsewhere in this
// feature. Harmless on iOS/Android: no `keydown` DOM event exists there, so `onKeyDown` is simply
// never invoked, mirroring the "no-op on native" precedent those `aria-*` props already
// established for this exact react-native-web version.
export interface WebKeyActivationEvent {
  key?: string;
  preventDefault?: () => void;
}

export interface WebKeyActivationProps {
  onKeyDown: (event: WebKeyActivationEvent) => void;
}

export function spaceKeyActivation(activate: () => void, disabled = false): WebKeyActivationProps {
  return {
    onKeyDown: (event) => {
      if (disabled) return;
      const key = event?.key;
      if (key === " " || key === "Spacebar") {
        // Prevents the browser's own default Space behavior (scrolling the page) — the same
        // `preventDefault` react-native-web's own PressResponder already calls internally for
        // role="button" elements, mirrored here for every other role it left unhandled.
        event.preventDefault?.();
        activate();
      }
    },
  };
}
