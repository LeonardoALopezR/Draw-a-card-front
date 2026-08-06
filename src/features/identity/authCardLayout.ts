// 010-registration-redesign T012 (FR-016, plan.md Research Decision 6): the one existing
// precedent for "a card on a web auth surface" in this codebase is LoginScreenChrome.web.tsx's
// own 660px CARD_MAX_WIDTH (confirmed by grepping every `maxWidth`/`*_MAX_WIDTH` literal in
// src/ and app/ on 2026-08-06). This feature's new CrearCuentaScreen.web.tsx reuses that exact
// value via this shared constant instead of hardcoding a second, independently-drifting 660 (or
// the registration mockup's own ~910px, which the design brief explicitly instructs against
// adopting as a one-off — docs/design-brief-registration-redesign.md §2 Layout). Plain exported
// number, no React import needed (Constitution IV).
export const AUTH_CARD_MAX_WIDTH = 660;
