// 010-registration-redesign T013 (FR-007): the `Crear cuenta` screen's complete Spanish-default/
// English-parity copy dictionary — title/subtitle, the segmented control's two labels, every
// field label/placeholder on both the `Usuario` and `Tienda` tabs (design brief §2-§4), the two
// consent-row labels, the submit button's idle/busy copy, and the shared `Select` primitive's
// (src/features/ui/Select.types.ts, T006) copy-override props, so a caller (UsuarioForm, a later
// task) can pass Spanish defaults into the `Nacionalidad` picker instead of Select's own English
// fallbacks. Mirrors login.ts's structure/conventions exactly (see that file's own doc comment).
//
// Orthography note (design brief §2, explicit): ship correct Spanish accents (`Correo
// electrónico`, `Contraseña`, `Política`, `Términos`) — the mockup tool's unaccented rendering
// (`Correo electronico`, `Contrasena`) is a font/render artifact of that tool, not the target.
//
// `label.field`/`label.fieldSentence` (src/theme/typography.ts) apply their own case treatment
// at render time, so labels are stored here in natural sentence case ("Nombre comercial", not
// "NOMBRE COMERCIAL") — this screen renders sentence-case labels (FormField's `labelCase`
// prop, T004), unlike the rest of the app's existing uppercase labels.
//
// Deliberately NOT covering the schemas' own field-level validation messages
// (personalRegistrationSchema/profileFormSchema/tiendaProfileFormSchema, src/domain/schemas.ts)
// — those are reused verbatim (docs/conventions.md's "reuse the schema, don't duplicate
// validation") and remain plain, un-localized English strings, the same pre-existing state every
// other schema-driven form in this app is already in (signInSchema, requestPasswordResetSchema,
// etc.) — relocalizing them is a separate, cross-cutting concern out of this task's scope.
const es = {
  // --- Shared chrome (design brief §2) ---
  title: "Crear cuenta",
  subtitle: "Completa tu perfil",
  usuarioTabLabel: "Usuario",
  tiendaTabLabel: "Tienda",

  // --- Shared fields (both tabs) ---
  emailLabel: "Correo electrónico",
  emailPlaceholder: "correo@ejemplo.com",
  passwordLabel: "Contraseña",
  usernameLabel: "Usuario",
  phoneLabel: "Celular",
  phonePlaceholder: "+52 55 0000 0000",
  rfcLabel: "RFC",

  // --- Usuario tab (design brief §3) ---
  nombreLabel: "Nombre(s)",
  nombrePlaceholder: "Juan",
  apellidoPaternoLabel: "Apellido paterno",
  apellidoPaternoPlaceholder: "Garcia",
  apellidoMaternoLabel: "Apellido materno",
  apellidoMaternoPlaceholder: "Lopez",
  usuarioUsernamePlaceholder: "@miusuario",
  birthDateLabel: "Fecha de nacimiento",
  birthDatePlaceholder: "dd/mm/aaaa",
  // T029 fix (native DateField's Modal-sheet confirm button — see DateField.tsx's top comment):
  // mirrors Select's own copy-override convention (defaults to English, this is the override).
  dateConfirmLabel: "Aceptar",
  nationalityLabel: "Nacionalidad",
  nationalityPlaceholder: "Mexicana",
  // T020 (FR-012, spec.md Edge Cases): the catalog-load-failure message useNationalities()
  // (T011) surfaces via Select's `error` prop — useNationalities.ts deliberately ships its own
  // fallback un-localized (see that file's top comment: "this hook's caller ... is free to
  // override this with localized copy"); this is that override, wired at the
  // CrearCuentaScreen/UsuarioForm call-site boundary (T020), not inside the hook itself.
  nationalityLoadError: "No pudimos cargar el catálogo de nacionalidades.",
  curpLabel: "CURP",
  curpPlaceholder: "GARL900101HDFRCN04",
  rfcPlaceholder: "GARL900101AB1",

  // --- Tienda tab (design brief §4) ---
  commercialNameLabel: "Nombre comercial",
  commercialNamePlaceholder: "Mi Tienda de Cartas",
  tiendaUsernamePlaceholder: "@mitienda",
  tiendaRfcPlaceholder: "MTC900101AAA",
  fiscalAddressLabel: "Domicilio fiscal",
  fiscalAddressPlaceholder: "Calle, Número, CP",

  // --- Consent rows (both tabs, design brief §2) ---
  tosConsentLabel: "Acepto los Términos de Uso",
  privacyConsentLabel: "Acepto la Política de Privacidad",

  // --- Submit (both tabs) ---
  submitLabel: "Registrarse",
  submitBusyLabel: "Creando cuenta…",

  // --- Select primitive copy overrides (Nacionalidad picker, FR-012 — Select.tsx/Select.web.tsx
  // render no hardcoded copy of their own; a caller supplies these via the retryLabel/
  // searchPlaceholder/loadingLabel/filterAccessibilityLabel/closeAccessibilityLabel props,
  // Select.types.ts) ---
  selectRetryLabel: "Reintentar",
  selectSearchPlaceholder: "Buscar…",
  selectLoadingLabel: "Cargando…",
  selectFilterAccessibilityLabel: "Filtrar opciones",
  selectCloseAccessibilityLabel: "Cerrar",

  // --- Session-issue recovery view (T017, CrearCuentaScreen.tsx/.web.tsx): the registration-
  // succeeded-but-Supabase-sign-in-failed honest-failure UX app/(auth)/register.tsx already
  // established (001-registration-kyc T031), moved into this screen's new home. The body is
  // split into a prefix/suffix pair (not one templated string) so the dynamic sessionError
  // message can be rendered as its own inline Text between them — translate() only resolves
  // static keys, no string interpolation, mirroring loginCopy's own legal-line convention of
  // nesting dynamic/linked spans as separate Text children rather than templating a single
  // string. ---
  sessionIssueTitle: "Tu cuenta fue creada",
  sessionIssueBodyPrefix: "No pudimos iniciar tu sesión automáticamente (",
  sessionIssueBodySuffix:
    "). Esto puede ocurrir si tu cuenta requiere confirmación por correo antes de iniciar " +
    "sesión. Revisa tu bandeja de entrada y luego toca Reintentar — tu registro ya fue exitoso " +
    "y no se repetirá.",
  retrySignInLabel: "Reintentar inicio de sesión",
  retrySignInBusyLabel: "Reintentando…",
};

// `en`'s type is constrained to exactly `es`'s keys — a missing English translation is a
// compile-time error, not just a unit-test failure (registration.test.ts's runtime key-parity
// check below is defense-in-depth for a key present with an accidentally-empty value).
const en: Record<keyof typeof es, string> = {
  title: "Create account",
  subtitle: "Complete your profile",
  usuarioTabLabel: "Individual",
  tiendaTabLabel: "Business",

  emailLabel: "Email",
  emailPlaceholder: "email@example.com",
  passwordLabel: "Password",
  usernameLabel: "Username",
  phoneLabel: "Phone",
  phonePlaceholder: "+52 55 0000 0000",
  rfcLabel: "RFC",

  nombreLabel: "First name(s)",
  nombrePlaceholder: "John",
  apellidoPaternoLabel: "Paternal surname",
  apellidoPaternoPlaceholder: "Smith",
  apellidoMaternoLabel: "Maternal surname",
  apellidoMaternoPlaceholder: "Doe",
  usuarioUsernamePlaceholder: "@myusername",
  birthDateLabel: "Date of birth",
  birthDatePlaceholder: "mm/dd/yyyy",
  dateConfirmLabel: "Done",
  nationalityLabel: "Nationality",
  nationalityPlaceholder: "Mexican",
  nationalityLoadError: "We couldn't load the list of nationalities.",
  curpLabel: "CURP",
  curpPlaceholder: "GARL900101HDFRCN04",
  rfcPlaceholder: "GARL900101AB1",

  commercialNameLabel: "Business name",
  commercialNamePlaceholder: "My Card Shop",
  tiendaUsernamePlaceholder: "@myshop",
  tiendaRfcPlaceholder: "MTC900101AAA",
  fiscalAddressLabel: "Fiscal address",
  fiscalAddressPlaceholder: "Street, Number, ZIP",

  tosConsentLabel: "I accept the Terms of Use",
  privacyConsentLabel: "I accept the Privacy Policy",

  submitLabel: "Sign up",
  submitBusyLabel: "Creating account…",

  selectRetryLabel: "Retry",
  selectSearchPlaceholder: "Search…",
  selectLoadingLabel: "Loading…",
  selectFilterAccessibilityLabel: "Filter options",
  selectCloseAccessibilityLabel: "Close",

  sessionIssueTitle: "Your account was created",
  sessionIssueBodyPrefix: "We couldn't sign you in automatically (",
  sessionIssueBodySuffix:
    "). This can happen if your account requires email confirmation before you can sign in. " +
    "Check your inbox, then tap Retry — your registration was already successful and won't be " +
    "repeated.",
  retrySignInLabel: "Retry sign-in",
  retrySignInBusyLabel: "Retrying…",
};

export const registrationCopy = { es, en };
