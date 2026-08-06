// T019 (FR-010): the login screen's complete Spanish/English copy dictionary — every string
// docs/design-brief-visual-identity.md §4 specifies for the plain sign-in view, PLUS every
// existing (pre-006, currently English-hardcoded) literal string actually present today in
// src/features/identity/SignInForm.tsx, RequestPasswordResetForm.tsx, and ResetPasswordForm.tsx
// (enumerated by reading those three files directly, not only the brief's own explicit list —
// form titles, field labels, resend/back/confirmation copy, etc.). Consumed via
// useTranslation(loginCopy) once the login screen's own restyle tasks (T023+) wire it in — this
// task only builds and tests the dictionary itself.
//
// `label.field`/`label.section` (src/theme/typography.ts) already apply `textTransform:
// "uppercase"` at render time, so labels are stored here in natural case ("Correo", not "CORREO")
// — the brief's all-caps rendering (CORREO/CONTRASEÑA) comes from that shared style, not from
// shouting in the dictionary itself.
//
// Orthography note (brief §4, explicit): ship correct Spanish accents (CONTRASEÑA, "Olvidé mi
// contraseña", "Términos", "Política") — the mockup tool's unaccented rendering (CONTRASENA,
// "Olvide") is a font/render artifact of that tool, not the target.
//
// `resendCodeWithSeconds` carries a literal `{{seconds}}` placeholder token: translate() (T018)
// deliberately has no interpolation support (this is the app's first i18n use case and needs none
// anywhere else — plan.md's "i18n mechanism" Research Decision), so the one existing string that
// needs a live number substituted in (ResetPasswordForm.tsx's "Resend code (${secondsRemaining}s)")
// is stored as a plain-string template; whichever future task wires this dictionary into
// ResetPasswordForm.tsx does a simple `.replace("{{seconds}}", String(secondsRemaining))` at the
// call site rather than teaching translate() a general interpolation feature for this one case.
const es = {
  // --- Brand block (brief §4 items 1-3) ---
  brandTitle: "Draw a Card",
  tagline: "Tu plataforma de cartas coleccionables",

  // --- Shared field copy (brief §4 items 4-5; also SignInForm/RequestPasswordResetForm/
  // ResetPasswordForm's existing "Email"/"Password" FormField labels + accessibilityLabels) ---
  emailLabel: "Correo",
  emailPlaceholder: "correo@ejemplo.com",
  passwordLabel: "Contraseña",

  // --- SignInForm.tsx (brief §4 items 6-9, plus its current hardcoded strings) ---
  forgotPassword: "Olvidé mi contraseña",
  signInButton: "Entrar",
  signingIn: "Entrando…",
  createAccount: "Crear cuenta",

  // --- Legal line (brief §4 item 10 — three separately-keyed segments, two of them links) ---
  legalPrefix: "Al continuar aceptas los",
  termsLink: "Términos de Uso",
  legalMiddle: "y la",
  privacyLink: "Política de Privacidad",

  // --- RequestPasswordResetForm.tsx (currently hardcoded; brief has no mockup for this view —
  // plan.md's "Forgot-password sub-views inherit the vocabulary" Research Decision) ---
  requestResetTitle: "Restablece tu contraseña",
  requestResetSubtitle: "Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.",
  requestResetConfirmation: "Si ese correo está registrado, te hemos enviado un código",
  sendResetCode: "Enviar código",
  sendingResetCode: "Enviando…",
  backToSignIn: "Volver a iniciar sesión",

  // --- ResetPasswordForm.tsx (currently hardcoded) ---
  resetCodeTitle: "Ingresa tu código de restablecimiento",
  resetCodeSentMessage: "Si ese correo está registrado, te hemos enviado un código.",
  resetCodeSubtitle: "Ingresa el código que te enviamos por correo, junto con una nueva contraseña.",
  resetCodeLabel: "Código de restablecimiento",
  newPasswordLabel: "Nueva contraseña",
  setNewPassword: "Guardar nueva contraseña",
  settingPassword: "Guardando…",
  resendCode: "Reenviar código",
  resendCodeWithSeconds: "Reenviar código ({{seconds}}s)",
};

// `en`'s type is constrained to exactly `es`'s keys — a missing English translation is a
// compile-time error, not just a unit-test failure (copy/login.test.ts's runtime key-parity check
// below is defense-in-depth for the case of a key present with an accidentally-empty value).
const en: Record<keyof typeof es, string> = {
  brandTitle: "Draw a Card",
  tagline: "Your collectible card platform",

  emailLabel: "Email",
  emailPlaceholder: "email@example.com",
  passwordLabel: "Password",

  forgotPassword: "Forgot password?",
  signInButton: "Sign in",
  signingIn: "Signing in…",
  createAccount: "Create account",

  legalPrefix: "By continuing you agree to the",
  termsLink: "Terms of Use",
  legalMiddle: "and the",
  privacyLink: "Privacy Policy",

  requestResetTitle: "Reset your password",
  requestResetSubtitle: "Enter your email and we'll send you a code to reset your password.",
  requestResetConfirmation: "If that email is registered, we've sent a code",
  sendResetCode: "Send reset code",
  sendingResetCode: "Sending…",
  backToSignIn: "Back to sign in",

  resetCodeTitle: "Enter your reset code",
  resetCodeSentMessage: "If that email is registered, we've sent a code.",
  resetCodeSubtitle: "Enter the code we emailed you, along with a new password.",
  resetCodeLabel: "Reset code",
  newPasswordLabel: "New password",
  setNewPassword: "Set new password",
  settingPassword: "Setting password…",
  resendCode: "Resend code",
  resendCodeWithSeconds: "Resend code ({{seconds}}s)",
};

export const loginCopy = { es, en };
