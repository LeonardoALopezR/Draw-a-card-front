# Design brief — visual identity (login + scan)

> Source: four mockups the human supplied on 2026-08-05 (login mobile, login web, scan mobile,
> scan web). The images themselves are not in the repo — **this file is the authoritative
> transcription of them.** Implement against this document, not against memory of the images.
>
> Scope decisions the human made when handing these over are recorded in §7. Read them before
> assuming anything the mockups show is in scope.

## 1. What the mockups establish

The app currently has **no visual identity**: every screen hardcodes its own hex values
(`#111827`, `#d1d5db`, `#374151`…) and there is no theme/token module anywhere in `src/`. The
mockups introduce a coherent brand — lime-on-dark-green, serif display type, pill geometry, soft
elevation — that must live in a **shared token layer**, not be re-typed per screen.

## 2. Tokens

### 2.1 Color (light theme)

| Token | Value | Used for |
|---|---|---|
| `brand.primary` | `#C7F24C` | Logo tile fill, primary button fill, viewfinder corner brackets, active nav accent |
| `brand.onPrimary` | `#10281A` | Text/glyphs sitting on `brand.primary` |
| `text.primary` | `#10281A` | Headings, primary button label, bold list text |
| `text.secondary` | `#6B7280` | Taglines, meta rows, muted body copy |
| `text.placeholder` | `#9CA3AF` | Input placeholders, viewfinder hint text |
| `text.link` | `#2F9E4F` | "Olvide mi contraseña", legal links, "Cámara disponible" pill text |
| `bg.page` | `#ECEDEE` | App page background (light warm gray) |
| `bg.surface` | `#FFFFFF` | Inputs, cards, list rows, secondary button |
| `bg.surfaceMuted` | `#F7F8F8` | Web login card, web main-column background |
| `border.subtle` | `#E3E5E6` | Hairline borders, dividers |
| `border.input` | `#DDE0E1` | Web input borders (mobile inputs are borderless) |
| `border.dashed` | `#C9CDCE` | Upload dropzone, empty results panel |
| `viewfinder.bg` | `#0B0F0C` | Camera preview area (near-black, faint green cast) |
| `viewfinder.grid` | `rgba(199,242,76,0.10)` | Grid lines inside the viewfinder |
| `accent.priceGreen` | `#22A15A` | Prices in the recent-scans list |
| `accent.pillBg` | `#E4F5E7` | "Cámara disponible" status-pill background |

Structure the token module so a **dark theme can be added later without touching call sites** —
semantic names (`text.primary`), never raw hex, at every consumer. Dark mode itself is **out of
scope** (§7).

### 2.2 Typography

Two families:

- **Display (serif, bold)** — "Draw a Card", "Escanear", "Escanear carta". A bold transitional
  serif. Pick the closest available on all three targets; if no serif is bundled, this is the one
  place a font asset is worth adding. Do not fake it with a bolded sans.
- **UI (sans)** — everything else: labels, inputs, buttons, body, meta.

| Role | Size | Weight | Notes |
|---|---|---|---|
| `display.xl` | 40 | 700 serif | "Draw a Card" |
| `display.lg` | 28 | 700 serif | Screen titles ("Escanear", "Escanear carta") |
| `body.tagline` | 15 | 400 sans | `text.secondary` |
| `label.field` | 12 | 500 sans | **UPPERCASE**, letter-spacing ~0.08em, `text.secondary` |
| `body.input` | 16 | 400 sans | Never below 16 — smaller triggers iOS zoom-on-focus |
| `button.label` | 16 | 700 sans | Both primary and secondary |
| `body.link` | 14 | 500 sans | `text.link` |
| `body.legal` | 12 | 400 sans | Centered, `text.secondary`, links in `text.link` |
| `label.section` | 12 | 600 sans | **UPPERCASE**, letter-spaced ("ESCANEOS RECIENTES") |

### 2.3 Geometry

| Token | Value |
|---|---|
| `radius.pill` | `999` (buttons, inputs on mobile, status pills) |
| `radius.card` | `28` (web login card) |
| `radius.panel` | `20` (viewfinder, results panel) |
| `radius.tile` | `26` (logo tile) |
| `radius.row` | `16` (list rows, search field, upload dropzone) |
| `space.*` | 4-based scale: 4, 8, 12, 16, 20, 24, 32, 40, 48 |
| `control.height` | `56` (primary/secondary buttons, inputs) — comfortably over the 44pt floor |

### 2.4 Elevation

Soft, wide, low-opacity shadows — never hard borders on mobile surfaces:

- `shadow.surface` — inputs/rows/cards: y-offset 2, blur 12, `rgba(16,40,26,0.06)`
- `shadow.raised` — logo tile, primary button: y-offset 6, blur 20, `rgba(16,40,26,0.12)`

On web these map to `boxShadow`; on native to the `shadowColor/shadowOffset/shadowRadius/
shadowOpacity` + `elevation` pair. Put that platform split in the token layer, not in screens.

## 3. Shared components the mockups imply

Both screens reuse the same primitives — build them once, in `src/features/<domain>/` or a shared
UI folder, per Constitution Principle V:

1. **`BrandMark`** — rounded square, `brand.primary` fill, `radius.tile`, serif "D" in
   `brand.onPrimary`, `shadow.raised`. 112px on the login screen.
2. **`PrimaryButton`** — full-width, `control.height`, `radius.pill`, `brand.primary` fill,
   `brand.onPrimary` bold label, `shadow.raised`. Disabled = 60% opacity.
3. **`SecondaryButton`** — same geometry, `bg.surface` fill, `border.subtle` 1px, `text.primary`
   bold label.
4. **`Field`** — uppercase `label.field` above a `bg.surface` input, `radius.pill`,
   `control.height`, horizontal padding 20. **Mobile: no border, `shadow.surface`. Web: 1px
   `border.input`, no shadow.** This is the existing `FormField`, restyled — extend it rather than
   adding a parallel component.
5. **`OrDivider`** — hairline `border.subtle` rule, broken in the middle by a small centered
   lowercase "o" on `bg.page`.
6. **`StatusPill`** — `accent.pillBg` fill, `text.link` label, `radius.pill`, small horizontal
   padding. ("Cámara disponible")

## 4. Login screen

Copy is **Spanish** (see §7 — routed through the i18n layer, never hardcoded).

Content order, identical on both platforms:

1. `BrandMark` (centered)
2. `display.xl` "Draw a Card"
3. `body.tagline` "Tu plataforma de cartas coleccionables"
4. Field — label `CORREO`, placeholder `correo@ejemplo.com`, email keyboard/autocomplete
5. Field — label `CONTRASEÑA`, secure entry
6. **Right-aligned** `body.link` "Olvidé mi contraseña" → existing `onForgotPassword` local-state
   trigger, **still not a route change** (005's FR-006 constraint is unchanged by this restyle)
7. `PrimaryButton` "Entrar"
8. `OrDivider`
9. `SecondaryButton` "Crear cuenta" → keeps the existing `<Link href="/register">` behavior
10. `body.legal` "Al continuar aceptas los **Términos de Uso** y la **Política de Privacidad**",
    centered, both phrases as `text.link`

Note the mockups render the labels without accents (`CONTRASENA`, `Olvide`). That is a font/render
artifact of the mockup tool — **ship correct Spanish orthography** (`CONTRASEÑA`, `Olvidé mi
contraseña`, `Términos`, `Política`).

### 4.1 Mobile

Full-bleed. A soft vertical gradient heads the screen — pale lime wash (`rgba(199,242,76,0.22)`)
at the top fading to `bg.page` by roughly 45% of the viewport height — with the brand block
(1–3) sitting inside it. The form block (4–10) sits on flat `bg.page`. Horizontal padding 24.

### 4.2 Web

`bg.page` fills the viewport, carrying two very faint lime radial blooms (top-right and
bottom-left, ~`rgba(199,242,76,0.18)`, heavily blurred). Content sits in a **centered card**:
`bg.surfaceMuted`, `radius.card`, `shadow.surface`, max-width 660, padding 48, vertically
centered. No gradient inside the card. Inputs take the bordered web treatment (§3.4).

Use the `.web.tsx` convention for this split (Constitution I) — **not** inline
`Platform.OS === "web"` conditionals scattered through the component.

## 5. Scan screen

**Visual shell only.** See §7: no camera import, no capture, no recognition, no data fetching.
`004-home-scan-shell`'s FR-005 and its source-inspecting test stay green. Every element below is
inert presentation; interactive-looking controls render disabled/no-op and must still be
correctly labelled for screen readers.

Shared content:

1. `display.lg` title — "Escanear" (mobile) / "Escanear carta" (web)
2. **Viewfinder** — `viewfinder.bg`, `radius.panel`, ~4:3. A faint `viewfinder.grid` 4×4 grid,
   lime L-shaped corner brackets inset ~16 in all four corners (~36 long, 3 thick), a centered
   camera glyph above `text.placeholder` copy "Apunta la cámara a la carta", and a small circular
   settings-gear chip inset at the top-right. Purely drawn — no camera surface behind it.
3. **Search field** — `bg.surface`, `radius.row`, `control.height`, placeholder "Buscar carta por
   nombre o código…", magnifier glyph at the right edge.
4. **Upload dropzone** — 1px dashed `border.dashed`, `radius.row`, centered "Subir imagen de
   carta" with a leading upload glyph.
5. `PrimaryButton` "Escanear carta".

### 5.1 Mobile

Single column, padding 20, elements stacked in the order above, the existing bottom tab bar
underneath. The current "Back" affordance on `app/scan.tsx` stays — restyled, not removed
(004 US2 AS2 depends on it).

### 5.2 Web

Existing sidebar on the left, unchanged in structure. Main area is a **two-column** layout:

- **Left column** — the title row (`display.lg` + `StatusPill` "Cámara disponible" beside it),
  then items 2–5 above.
- **Right column** —
  - **Empty results panel**: 1px dashed `border.dashed`, `radius.panel`, tall, centered playing-card
    glyph over "Escanea una carta para ver sus detalles aquí" (`text.secondary`) and "Los
    resultados aparecerán automáticamente" (`text.placeholder`, smaller).
  - **`label.section` "ESCANEOS RECIENTES"**, then a stack of rows: `bg.surface`, `radius.row`,
    `shadow.surface`, padding 16 — a 44px rounded colored thumbnail, then name (`text.primary`,
    600) over meta (`text.secondary`, 12, e.g. "PSA 10 · GEN-001"), then a right-aligned price in
    `accent.priceGreen`.

The recent-scans rows are **static placeholder content local to the component** — no API call, no
`src/domain` fetch, no persistence. They exist so the layout reads correctly. Mark them clearly in
code as placeholder-until-the-scanner-feature-ships.

Below the tablet breakpoint the two columns collapse to one (results panel below the controls).

## 6. Accessibility (Constitution VII, non-negotiable)

- Every interactive element keeps a ≥44×44 tap target — `control.height` 56 satisfies this, but
  check the small ones: the gear chip, the magnifier, the "Olvidé mi contraseña" link.
- Contrast: `brand.onPrimary` on `brand.primary` and `text.secondary` on `bg.page` both need to
  clear 4.5:1 — verify, don't assume. `text.placeholder` on `bg.surface` is decorative-adjacent but
  should still clear 4.5:1 for the input placeholders.
- The inert scan controls must not present as actionable to a screen reader — no bare
  `accessibilityRole="button"` on something that does nothing. Label them for what they are.
- Layout must survive a 375px-wide web viewport unchanged, and honor OS font scaling.

## 7. Scope decisions (from the human, 2026-08-05)

**In scope**
- The shared token layer + primitives (§2, §3).
- Login restyle (§4), mobile and web.
- Scan **visual shell** (§5), mobile and web.
- Spanish copy, delivered through an **i18n layer with English alongside it** — the human asked
  for "spanish and english… add a feature to choose the language". Copy is never hardcoded in a
  component; both locales ship.

**Explicitly out of scope**
- **Any camera functionality.** The scan mockup depicts a working scanner; only its appearance is
  being built. `004-home-scan-shell` FR-005 stands.
- **Real scan results / recent-scans data.** Static placeholder content only.
- **The 5-destination nav** the mockups show (Inicio · Escanear · Cartera · Trades · Perfil).
  The app has three destinations today; "Cartera" and "Trades" are unspecced features. Nav gets
  **restyled, not extended**.
- **Dark mode.** The mockups' "Dark / Mobile / Web" toggle pills and the "?" floating button are
  **mockup-tool chrome, not app UI** — do not build them. Tokens should merely leave room for a
  dark theme later.
- **The web sidebar's "v2.0 · PLD/AML" subtitle and the "Juan Doe / @juandoe · Free" footer** —
  these imply account tier and compliance state the app does not model yet.
- **Translating the other existing screens** (register, verify-phone, profile, KYC, home) — that
  and the language-picker UI belong to the follow-on localization feature.
