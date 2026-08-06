# Shared UI primitives module

**No backend counterpart to mirror.** Like `src/features/navigation/` before it, this module
does not correspond to a backend bounded context — there is no `ui` domain in the backend to
mirror. This is a deliberate, narrow, documented exception to Constitution Principle V
(`Screen/Component Structure Mirrors Product Domains`), recorded in
`specs/006-visual-identity/plan.md`'s Constitution Check:

> `src/theme/` (tokens) and `src/features/ui/` (BrandMark/PrimaryButton/SecondaryButton/
> OrDivider/StatusPill) have no single backend bounded context to mirror — they are
> cross-cutting design-system infrastructure consumed by both `identity` and `scanner`. This is
> additive, not a contradiction of an existing MUST — called out for visibility, not requiring a
> Complexity Tracking entry (matches `004`'s own precedent exactly).

This module owns only the six shared presentational primitives `docs/design-brief-visual-
identity.md` §3 specifies — `BrandMark`, `PrimaryButton`, `SecondaryButton`, `OrDivider`, and
`StatusPill` live here (the sixth, `Field`, stays inside `src/features/identity/FormField.tsx`
per an explicit human instruction to extend rather than parallel it — see `plan.md`'s Research
Decisions). Every primitive consumes `src/theme`'s semantic tokens exclusively (FR-001) and is
used by both `src/features/identity/` (login) and `src/features/scanner/` (scan) — the exact
"cross-cutting chrome between domains" shape `src/features/navigation/README.md` already
established as this repo's precedent for this kind of exception.
