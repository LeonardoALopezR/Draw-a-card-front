// 010-registration-redesign T009 (FR-009, Constitution Principle III): covers the module-level
// in-memory draft's atomic set/consume/clear contract — see registration-draft.ts's own doc
// comment for why this is deliberately volatile rather than persisted anywhere.
import {
  clearRegistrationDraft,
  consumeRegistrationDraft,
  draftMatchesEmail,
  setRegistrationDraft,
  type RegistrationDraft,
} from "./registration-draft";

const personalDraft: RegistrationDraft = {
  kind: "personal",
  email: "ana@example.com",
  nombre: "Ana",
  apellidoPaterno: "Garcia",
  birthDate: new Date("1990-01-01T00:00:00.000Z"),
  nationality: "MX",
  curp: "GARA900101MDFXXX01",
  rfc: "GARA900101ABC",
  tosAccepted: true,
  privacyAccepted: true,
};

const businessDraft: RegistrationDraft = {
  kind: "business",
  email: "tienda@example.com",
  commercialName: "Tienda Ana",
  rfc: "GARA900101ABC",
  fiscalAddress: "Calle Falsa 123, CDMX",
  tosAccepted: true,
  privacyAccepted: true,
};

describe("registration-draft (FR-009, Constitution III)", () => {
  afterEach(() => {
    // Every test in this file must start from a clean slate — module-level state persists
    // across tests within the same module instance otherwise.
    clearRegistrationDraft();
  });

  it("set-then-consume returns the exact value that was set (personal draft)", () => {
    setRegistrationDraft(personalDraft);
    expect(consumeRegistrationDraft()).toEqual(personalDraft);
  });

  it("set-then-consume returns the exact value that was set (business draft)", () => {
    setRegistrationDraft(businessDraft);
    expect(consumeRegistrationDraft()).toEqual(businessDraft);
  });

  it("a second consume call returns undefined -- a draft can never be read twice (the atomicity is the point)", () => {
    setRegistrationDraft(personalDraft);

    expect(consumeRegistrationDraft()).toEqual(personalDraft);
    expect(consumeRegistrationDraft()).toBeUndefined();
  });

  it("clearRegistrationDraft() after a set makes a subsequent consume return undefined", () => {
    setRegistrationDraft(personalDraft);
    clearRegistrationDraft();

    expect(consumeRegistrationDraft()).toBeUndefined();
  });

  it("consuming with nothing ever set returns undefined", () => {
    expect(consumeRegistrationDraft()).toBeUndefined();
  });

  it("a later set can overwrite an earlier, unconsumed draft (only the most recent survives)", () => {
    setRegistrationDraft(personalDraft);
    setRegistrationDraft(businessDraft);

    expect(consumeRegistrationDraft()).toEqual(businessDraft);
  });
});

// T020 (carried over from Run 6's code review, Finding 2): draftMatchesEmail()'s own doc comment
// claims a byte-for-byte comparison would produce false negatives on a legitimate match, since
// "Supabase normalizes stored email casing" — verify-phone.test.tsx's existing match/mismatch
// cases only ever use byte-identical vs. completely different strings, so that specific claim was
// asserted in prose only, never regression-guarded. These cases exercise the real, un-mocked
// comparison directly (Constitution IV — this is exactly the kind of logic src/lib/src/domain
// modules exist to make directly testable without rendering anything).
describe("draftMatchesEmail (FR-009, carried-over review Finding 2)", () => {
  it("matches when the email is byte-identical", () => {
    expect(draftMatchesEmail(personalDraft, "ana@example.com")).toBe(true);
  });

  it("does not match a completely different email", () => {
    expect(draftMatchesEmail(personalDraft, "bob@example.com")).toBe(false);
  });

  // THE REGRESSION CASE THIS TASK EXISTS FOR: same address, different casing only — the exact
  // shape Supabase's own email-casing normalization produces (the draft was written with
  // whatever casing the user originally typed; the session email read back later may be
  // lower/upper-cased differently by the auth provider).
  it("matches the same email with different casing", () => {
    expect(draftMatchesEmail(personalDraft, "ANA@EXAMPLE.COM")).toBe(true);
    expect(draftMatchesEmail(personalDraft, "Ana@Example.Com")).toBe(true);
  });

  // Leading/trailing whitespace on the value being compared against must not produce a false
  // mismatch either.
  it("matches the same email with surrounding whitespace", () => {
    expect(draftMatchesEmail(personalDraft, "  ana@example.com  ")).toBe(true);
  });

  // Combines both: different casing AND whitespace at once, still a genuine match.
  it("matches the same email with both different casing and surrounding whitespace", () => {
    expect(draftMatchesEmail(personalDraft, "  ANA@Example.COM  ")).toBe(true);
  });

  // Fail-closed posture (Constitution III's "never widen access under uncertainty"): an
  // unknown/unconfirmed session email (getCurrentSessionEmail() failing closed to null, or a
  // caller with no value at all) must never be treated as a match.
  it("never matches when the comparison email is null or undefined", () => {
    expect(draftMatchesEmail(personalDraft, null)).toBe(false);
    expect(draftMatchesEmail(personalDraft, undefined)).toBe(false);
  });
});
