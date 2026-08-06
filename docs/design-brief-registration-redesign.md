# Design brief — registration redesign (Usuario + Tienda)

> Source: eight mockups the human supplied on 2026-08-06 (Usuario mobile ×2, Usuario web ×2,
> Tienda web ×2, Usuario mobile ×2 — top and bottom halves of each). The images themselves are
> not in the repo — **this file is the authoritative transcription of them.** Implement against
> this document, not against memory of the images.
>
> Scope decisions the human made when handing these over are in §6; the conflicts between the
> mockups and the backend's real contract, and the decisions taken on them, are in §7. Read both
> before assuming anything the mockups show is in scope.
>
> Mockup-tool chrome that is **not app UI**: the `Dark` / `Mobile` / `Web` pills top-right, the
> floating `?` bubble bottom-right, and the phone bezel around the mobile shots. Same convention
> as `docs/design-brief-visual-identity.md` §7.

## 1. What the mockups establish

One screen — **`Crear cuenta`** — replaces what is today two separately-styled screens
(`app/(auth)/register.tsx` → `app/(auth)/profile.tsx`, both still on the pre-`006` unstyled
hardcoded-hex look). The screen carries a two-segment account-type switch and, per segment, the
full field set for that account type. It inherits `006-visual-identity`'s token layer wholesale:
lime-on-dark-green, serif display type, pill geometry, white surfaces on a warm-gray page.

Everything here is `src/theme` tokens and `src/features/ui` primitives. **No new hex literals.**

## 2. Shared chrome (both tabs)

| Element | Treatment |
|---|---|
| Title | `Crear cuenta` — serif display, `display.lg`, `text.primary` |
| Subtitle | `Completa tu perfil` — `body.tagline`, `text.secondary` |
| Segmented control | Full-width pill track, two equal segments: `Usuario` \| `Tienda` |
| — active segment | `brand.primary` (lime) fill, bold `brand.onPrimary` label, inner pill radius |
| — inactive segment | Track fill (pale lavender-gray, ≈`#EDEEF5`; add a token, do not inline), `text.secondary` label, no fill of its own |
| — track | Full pill radius, ~56px tall on mobile, same on web |
| Field label | `label.field` — **sentence case here, not uppercase** (`Nombre completo`, `Correo electronico`), `text.secondary` |
| Field input | White `bg.surface` pill, full radius, no visible border on mobile; `border.input` hairline on web. `body.input` (16px), `text.placeholder` for placeholder copy |
| Section header | `DOCUMENTOS` — uppercase, letter-spaced, `text.secondary` (the section itself is out of scope, §6) |
| Consent rows | Circular outline checkbox + label: `Acepto los Terminos de Uso`, `Acepto la Politica de Privacidad` |
| Submit | `Registrarse` — full-width lime pill, bold `brand.onPrimary`, `PrimaryButton` |

Copy in the mockups is unaccented (`Correo electronico`, `Terminos`, `Politica`,
`Identificacion`). **Ship properly accented Spanish** (`Correo electrónico`, `Términos`,
`Política`, `Identificación`) — the mockup tool dropped the diacritics, that is not a design
decision. All copy goes through `src/domain/i18n` (`006` FR-012), Spanish default, with English
keys at parity.

### Layout

- **Mobile** — single column, page-background `bg.page`, inputs are white pills floating directly
  on it. Full-height scroll.
- **Web** — the same single column, centred in a white `bg.surface` card with generous padding on
  a `bg.page` field. Card max-width ≈ 910px in the mockup; cap it at the same width the rest of
  the app's web surfaces use rather than introducing a one-off.
- Platform split, if any is needed at all, uses the `.web.tsx` convention — never inline
  `Platform.OS` (Constitution I).

## 3. `Usuario` tab — fields, top to bottom

| # | Mockup label | Placeholder | Redesign |
|---|---|---|---|
| 1 | `Nombre completo` | `Juan Garcia Lopez` | **Split into three inputs** (the human's request): `Nombre(s)`, `Apellido paterno`, `Apellido materno`. Maps 1:1 to `User.nombre` / `apellidoPaterno` / `apellidoMaterno`. `apellidoMaterno` is genuinely optional server-side — label it so. |
| 2 | `Correo electronico` | `correo@ejemplo.com` | As drawn. `User.email` |
| — | *(not in mockup)* | — | **`Contraseña` — added, see §7.1.** Placed directly under the email field |
| 3 | `Usuario` | `@miusuario` | As drawn. `User.username` |
| 4 | `Fecha de nacimiento` | `dd/mm/yyyy` + calendar glyph | Date input. `User.birthDate`. See §7.4 |
| 5 | `Celular` | `+52 55 0000 0000` | As drawn. `User.phone` |
| 6 | `Nacionalidad` | `Mexicana` | **Becomes a catalog picker** (the human's request), backed by the backend catalog — see §7.3. `User.nationality` |
| 7 | `CURP / RFC` | `GARL900101HDFRCN04` | **Split into two inputs**, `CURP` and `RFC` — see §7.2. `User.curp` / `User.rfc` |
| 8 | `DOCUMENTOS` | — | **Out of scope** (§6) |
| 9 | Consent rows ×2 | — | As drawn |
| 10 | `Registrarse` | — | As drawn |

## 4. `Tienda` tab — fields, top to bottom

| # | Mockup element | Placeholder | Redesign |
|---|---|---|---|
| — | Blue `Cumplimiento PLD/AML` banner (shield icon, "Los campos marcados son requeridos por regulacion antilavado.") | — | **Out of scope** (§6) |
| 1 | `Nombre comercial` | `Mi Tienda de Cartas` | As drawn. `BusinessProfile.commercialName` |
| 2 | `Correo electronico` | `tienda@ejemplo.com` | As drawn. `User.email` |
| — | *(not in mockup)* | — | **`Contraseña` — added, see §7.1** |
| 3 | `Usuario` | `@mitienda` | As drawn. `User.username` |
| 4 | `RFC (PLD)` — label rendered in blue with a `(PLD)` suffix, input carries a blue border | `MTC900101AAA` | Field is **in scope**; the `(PLD)` marker and blue treatment are **not** — see §7.5. `BusinessProfile.rfc` |
| 5 | `Celular` | `+52 55 0000 0000` | As drawn. `User.phone` |
| 6 | `Domicilio fiscal` | `Calle, Numero, CP` | As drawn. `BusinessProfile.fiscalAddress` |
| 7 | `Datos bancarios (PLD)` | `CLABE / Numero cuenta` | **Out of scope** (§6) |
| 8 | `DOCUMENTOS` (`Constancia fiscal`, `ID del representante`, `Comprobante de domicilio`) | — | **Out of scope** (§6) |
| 9 | Consent rows ×2 | — | As drawn |
| 10 | `Registrarse` | — | As drawn |

Note what the Tienda tab deliberately does **not** collect: no personal name, no birth date, no
nationality, no CURP. That is a real divergence from today's backend contract and it was decided
in the backend's favour of the mockup — §7.6.

## 5. Documents section — appearance only, for whoever builds it later

Recorded so `002-kyc-document-verification` inherits the visual spec rather than re-deriving it.
**Nothing in this section is built by this feature.** Each row: dashed `border.dashed` rounded
rectangle, paperclip glyph, label on the left, a small outlined `Subir` pill on the right.
Usuario rows: `Identificación oficial`, `Prueba de vida (selfie)`, `Comprobante de domicilio`.
Tienda rows: `Constancia fiscal`, `ID del representante`, `Comprobante de domicilio`.

## 6. Scope decisions the human made when handing the mockups over

**In scope**

- The single `Crear cuenta` screen with the `Usuario` / `Tienda` segmented switch, both tabs.
- Splitting `Nombre completo` into three inputs.
- Turning `Nacionalidad` into a catalog-backed picker.
- Every in-scope field on both tabs being genuinely persisted to the backend, each in its own
  column.

**Out of scope, by explicit instruction**

- The `DOCUMENTOS` section on **both** tabs (upload rows, `Subir` buttons, any capture or upload
  behaviour). That belongs to `002-kyc-document-verification`. §5 records the visual spec only.
- The blue `Cumplimiento PLD/AML` banner on the Tienda tab.
- `Datos bancarios (PLD)` / CLABE on the Tienda tab. Note `BusinessProfile` has no bank-account
  column today and `BankAccount` is a separate unused model — leaving this out means no schema
  question to answer here.

## 7. Mockup ↔ backend conflicts, and the decisions taken

The mockups were drawn against the product idea, not against the shipped API. Six divergences
were found by reading `Draw-a-card/prisma/schema.prisma`,
`src/modules/identity/validation.ts` and `routes.ts` directly. Three were put to the human on
2026-08-06 and answered; three carry a recommended default and are **flagged for confirmation at
the `spec_ready` gate**.

### 7.1 No password field anywhere in the mockups — RESOLVED, field added

`POST /identity/register` requires `password` (min 8), and sign-in is Supabase Auth — an account
cannot exist without one. A password input is therefore **added to both tabs**, directly under
the email field. Single field, no confirm-password input (matches `personalRegistrationSchema`,
which has never had one). This is an addition to the mockup, made because the mockup is not
satisfiable without it.

### 7.2 One combined `CURP / RFC` input, two required backend columns — DEFAULT, confirm at gate

`profilePersonalSchema` requires `curp` **and** `rfc` as separate non-empty strings, and
`User` has a column for each. One input cannot populate two required columns without the client
inventing a split rule for values that are genuinely different strings.

**Recommended default: render two inputs, `CURP` and `RFC`.** This is also what
`001-registration-kyc` already shipped. The alternative — keep one combined input and relax
`rfc` to optional on the backend — is a real option but was not requested and would lose data
the product's own compliance framing says it wants.

### 7.3 `Nacionalidad` has no catalog — RESOLVED, backend catalog

`nationality` is `z.string().min(1)` today: free text, unvalidated. The human chose a
**backend-served catalog** over a static frontend list, so the list is one source of truth and
editable without an app release. Registered as backend feature `015-registration-profile-support`
(User Story 1). The frontend picker fetches it; `nationality` gets validated against the catalog
server-side on write.

Frontend consequence: **there is no select/dropdown/picker primitive in `src/features/ui/`
today.** One has to be built (accessible, keyboard-operable on web, native-appropriate on
iOS/Android, `.web.tsx` split if needed) — treat it as a shared primitive, not a one-off inside
the registration form.

### 7.4 `Fecha de nacimiento` is a real date input in the mockup — DEFAULT, confirm at gate

Today `ProfileForm` collects the birth date as a plain `TextInput` with a `YYYY-MM-DD`
placeholder, deliberately: its own comment records that no date-picker dependency is installed
and adding one would be undocumented. The mockup shows a native date control (`dd/mm/yyyy` with a
calendar affordance on web).

**Recommended default: a real date control, which means a new dependency on native**
(`@react-native-community/datetimepicker` or Expo's equivalent) with the web side using the
platform's native date input via the `.web.tsx` split. Justify the dependency in `plan.md`'s
Research Decisions, as `006` did for `expo-font`. If the human would rather not take the
dependency, the fallback is a masked `dd/mm/yyyy` text input — worse UX, zero new packages.

### 7.5 `RFC (PLD)` blue marker without its explanatory banner — DEFAULT, confirm at gate

The `(PLD)` suffix and blue field treatment exist to point back at the `Cumplimiento PLD/AML`
banner, which is out of scope (§6). Shipping a blue-marked field whose explanation was removed
leaves an unexplained visual state.

**Recommended default: render `RFC` as an ordinary field** — standard label colour, standard
border, no `(PLD)` suffix. When the banner is eventually built, the marker comes back with it.

### 7.6 Tienda profile requires personal fields server-side — RESOLVED, backend relaxes

`profileBusinessSchema` **extends** `profilePersonalSchema`, so a Tienda profile currently
requires `nombre`, `apellidoPaterno`, `birthDate`, `nationality` and `curp` on top of the
business fields. The Tienda mockup collects none of them.

The human chose to **relax the backend** rather than add those fields to the Tienda tab: a
business profile requires only `commercialName`, `rfc`, `fiscalAddress` + ToS/privacy acceptance.
Registered as backend feature `015-registration-profile-support` (User Story 2). The Tienda tab
ships exactly as drawn.

## 8. Flow — one screen, three calls behind it

The human chose (2026-08-06): **the mockup's single screen stays a single screen**, and the
backend's existing three-step sequence runs behind it. No backend flow change.

```
[ Crear cuenta ]  ── Registrarse ──▶  POST /identity/register(/business)   (email, password, phone, username)
                                              │
                                              ▼
                                     verify-phone screen  ── code ──▶  POST /identity/phone/verify
                                              │
                                              ▼
                                     POST /identity/me/profile            (everything else on the form)
```

Consequences the spec must state plainly rather than gloss:

- The existing SMS verify-phone step (`app/(auth)/verify-phone.tsx`, `VerifyPhoneScreen`) stays a
  visible screen. It is not removed and not hidden — it appears after `Registrarse` and before the
  profile call. It is the one interruption in an otherwise single-screen flow.
- The rest of the form's values must survive that interruption, since they are submitted *after*
  it. Where that in-flight state lives (and that it holds CURP/RFC, so it is never logged and
  never persisted beyond the flow's lifetime — Constitution III) is a plan-level decision.
- A failure at the profile call after a successful register + verify leaves a real account with an
  incomplete profile. Resumability is already a live concern in this codebase
  (`phoneVerifiedAt` is the backend's own resumable-registration marker) — the spec must say what
  the user sees, not assume the happy path.
- `app/(auth)/register.tsx` and `app/(auth)/profile.tsx` both exist today with their own tests.
  Whether the redesign replaces both routes or repoints them is a plan decision; either way
  `005-login`'s `KYC_ROUTE_TARGETS.unauthenticated → '/login'` and the `useKycGate()` /
  `resolveKycRoute()` gate must come out byte-for-byte unchanged, as every feature since `004` has
  held.

## 9. What already exists — do not rebuild it

Verified by reading the backend directly on 2026-08-06, not assumed:

- **Every column this redesign needs already exists.** `User.nombre`, `apellidoPaterno`,
  `apellidoMaterno`, `birthDate`, `nationality`, `curp`, `rfc`, `email`, `username`, `phone`;
  `BusinessProfile.commercialName`, `rfc`, `fiscalAddress`. **No migration is needed** for the
  name split or the birth date — `001-user-registration-kyc` already shipped them.
- The only backend work this redesign needs is the nationality catalog (§7.3) and the
  business-profile relaxation (§7.6) — both registered as backend `015-registration-profile-support`.
- Frontend: `src/domain/schemas.ts` (`personalRegistrationSchema`, `profileFormSchema`,
  `businessProfileFormSchema`), `src/domain/registration.ts`, `src/domain/profile.ts`,
  `src/features/identity/FormField.tsx`, `src/features/ui/PrimaryButton|SecondaryButton`,
  `src/theme/`, and `src/domain/i18n/` are all in place and are what this feature extends.
