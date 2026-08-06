// 010-registration-redesign T018 (FR-001, FR-008, plan.md Research Decision 1): thin glue only
// (Constitution IV) — renders CrearCuentaScreen (src/features/identity/CrearCuentaScreen.tsx,
// T017) in place of the pre-redesign RegistrationForm this route used to render directly. Every
// behavior that used to live here (the submit-then-navigate-to-verify-phone flow, the
// setCurrentUserId(user.id) call, and the registration-succeeded-but-sign-in-failed
// sessionIssue/retrySignIn recovery UI — 001-registration-kyc T031/T033) now lives in
// useCrearCuentaSubmit.ts (colocated with CrearCuentaScreen, see that hook's own top comment for
// why it was extracted there rather than duplicated across CrearCuentaScreen.tsx/.web.tsx) —
// nothing in that mechanism changed, only which file owns it. This route intentionally imports
// the bare `./CrearCuentaScreen` specifier (no `.web` suffix) so Expo Router's own
// platform-extension resolution picks CrearCuentaScreen.web.tsx on web and CrearCuentaScreen.tsx
// everywhere else — the exact mechanism LoginScreen.tsx's own `./LoginScreenChrome` import
// already relies on for its mobile/web split.
import { CrearCuentaScreen } from "@/features/identity/CrearCuentaScreen";

export default function RegisterScreen() {
  return <CrearCuentaScreen />;
}
