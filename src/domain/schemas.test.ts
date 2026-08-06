// Covers FR-005 (case-/accent-insensitive username uniqueness rule, including the character-
// set restriction it depends on) and the shape of the FR-001/FR-003/FR-004 request schemas
// mirrored from the real backend contract (Draw-a-card backend repo,
// src/modules/identity/validation.ts) — see schemas.ts's doc comments for the exact backend
// source each schema mirrors.
import {
  businessProfileFormSchema,
  businessRegistrationSchema,
  normalizeUsernameForComparison,
  passwordSchema,
  personalRegistrationSchema,
  profileFormSchema,
  requestPasswordResetSchema,
  resetPasswordWithCodeSchema,
  signInSchema,
  tiendaCrearCuentaSchema,
  tiendaProfileFormSchema,
  usernameSchema,
  usuarioCrearCuentaSchema,
  verificationCodeSchema,
} from "./schemas";

describe("usernameSchema", () => {
  // FR-005: accented Latin forms (José, Muñoz) are accepted, not rejected.
  it("accepts accented Latin usernames", () => {
    expect(usernameSchema.safeParse("José").success).toBe(true);
    expect(usernameSchema.safeParse("Muñoz").success).toBe(true);
  });

  it("accepts digits, underscore, dot, and hyphen", () => {
    expect(usernameSchema.safeParse("ana_garcia.99-mx").success).toBe(true);
  });

  // FR-005: Greek, Cyrillic, CJK, and emoji are rejected outright, matching the backend's
  // USERNAME_PATTERN exactly.
  it.each([["Θεός"], ["Пользователь"], ["用户名"], ["user😀"]])(
    "rejects non-Latin/emoji username %s",
    (value) => {
      expect(usernameSchema.safeParse(value).success).toBe(false);
    }
  );

  it("rejects an empty username", () => {
    expect(usernameSchema.safeParse("").success).toBe(false);
  });

  // FR-005: a decomposed (NFD) accented username — visually identical to its NFC form — must
  // still pass, mirroring the backend's NFC-preprocessing step.
  it("accepts an NFD-decomposed accented username (combining acute accent)", () => {
    // "Jose" + a combining acute accent (U+0301) over the final "e" — the NFD form of
    // "José", visually identical but byte-different from the precomposed form.
    const decomposedJose = "José";
    expect(decomposedJose.normalize("NFC")).toBe("José");
    expect(usernameSchema.safeParse(decomposedJose).success).toBe(true);
  });
});

describe("normalizeUsernameForComparison", () => {
  // FR-005: uniqueness must be case- and accent-insensitive — "José" and "jose" collide.
  it("collapses accents and casing so visually-similar usernames compare equal", () => {
    expect(normalizeUsernameForComparison("José")).toBe(normalizeUsernameForComparison("jose"));
    expect(normalizeUsernameForComparison("MUÑOZ")).toBe(normalizeUsernameForComparison("muñoz"));
  });

  it("does not collapse genuinely different usernames", () => {
    expect(normalizeUsernameForComparison("ana")).not.toBe(normalizeUsernameForComparison("ann"));
  });
});

describe("personalRegistrationSchema / businessRegistrationSchema", () => {
  const validInput = {
    email: "ana@example.com",
    password: "supersecret1",
    phone: "+525512345678",
    username: "ana_garcia",
  };

  // FR-001: happy path — only email/password/phone/username, no profile fields accepted here.
  it("accepts a valid personal registration payload", () => {
    expect(personalRegistrationSchema.safeParse(validInput).success).toBe(true);
  });

  // FR-001: validation-error path — password too short.
  it("rejects a password shorter than 8 characters", () => {
    const result = personalRegistrationSchema.safeParse({ ...validInput, password: "short" });
    expect(result.success).toBe(false);
  });

  // FR-001: validation-error path — malformed email.
  it("rejects an invalid email", () => {
    const result = personalRegistrationSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  // FR-003: business registration shares the identical credentials-only shape — no
  // commercialName/rfc/fiscalAddress accepted here (those move to the profile step).
  it("businessRegistrationSchema accepts the same shape as personalRegistrationSchema", () => {
    expect(businessRegistrationSchema.safeParse(validInput).success).toBe(true);
  });

  it("businessRegistrationSchema does not require (or reject the absence of) business fields", () => {
    const parsed = businessRegistrationSchema.parse(validInput);
    expect(parsed).not.toHaveProperty("commercialName");
    expect(parsed).not.toHaveProperty("rfc");
  });

  // 005-login FR-001 regression: personalRegistrationSchema.password was refactored to
  // delegate to the new shared passwordSchema (schemas.ts) instead of its own inline
  // z.string().min(8, ...) rule — this asserts the refactor is a byte-for-byte no-op: the
  // exact same threshold and the exact same message as before the refactor.
  it("password validation is unchanged by the passwordSchema refactor (same threshold, same message)", () => {
    const tooShort = personalRegistrationSchema.safeParse({ ...validInput, password: "short1" });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      const passwordIssue = tooShort.error.issues.find((issue) => issue.path[0] === "password");
      expect(passwordIssue?.message).toBe("Password must be at least 8 characters");
    }

    const exactlyEight = personalRegistrationSchema.safeParse({
      ...validInput,
      password: "12345678",
    });
    expect(exactlyEight.success).toBe(true);
  });
});

describe("passwordSchema", () => {
  // 005-login FR-001: the factored-out rule itself — same threshold/message as
  // personalRegistrationSchema.password used to enforce inline.
  it("rejects a password shorter than 8 characters with the shared message", () => {
    const result = passwordSchema.safeParse("short1");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
    }
  });

  it("accepts a password of exactly 8 characters", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
  });
});

describe("signInSchema", () => {
  const validInput = { email: "ana@example.com", password: "any-password-at-all" };

  // 005-login FR-001: happy path — a well-formed email and a non-empty password, regardless of
  // whether it would satisfy passwordSchema's 8-character rule (login does not re-enforce
  // strength, only presence).
  it("accepts a valid sign-in payload", () => {
    expect(signInSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts a password shorter than passwordSchema's 8-character minimum (no strength re-check on sign-in)", () => {
    expect(signInSchema.safeParse({ ...validInput, password: "a" }).success).toBe(true);
  });

  it("rejects a missing email", () => {
    const { email: _email, ...withoutEmail } = validInput;
    expect(signInSchema.safeParse(withoutEmail).success).toBe(false);
  });

  it("rejects an invalid email with a custom message", () => {
    const result = signInSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((issue) => issue.path[0] === "email");
      expect(emailIssue?.message).toBe("Enter a valid email address");
    }
  });

  it("rejects an empty password with a custom message", () => {
    const result = signInSchema.safeParse({ ...validInput, password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordIssue = result.error.issues.find((issue) => issue.path[0] === "password");
      expect(passwordIssue?.message).toBe("Enter your password");
    }
  });
});

describe("requestPasswordResetSchema", () => {
  // 005-login FR-007: happy path — email only.
  it("accepts a well-formed email", () => {
    expect(requestPasswordResetSchema.safeParse({ email: "ana@example.com" }).success).toBe(true);
  });

  it("rejects a missing email", () => {
    expect(requestPasswordResetSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an invalid email with a custom message", () => {
    const result = requestPasswordResetSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((issue) => issue.path[0] === "email");
      expect(emailIssue?.message).toBe("Enter a valid email address");
    }
  });
});

describe("resetPasswordWithCodeSchema", () => {
  const validInput = {
    email: "ana@example.com",
    code: "123456",
    password: "supersecret1",
  };

  // 005-login FR-008: happy path — well-formed email, a 6-digit code, and a password meeting
  // passwordSchema's 8-character minimum.
  it("accepts a valid reset-with-code payload", () => {
    expect(resetPasswordWithCodeSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = resetPasswordWithCodeSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  // 005-login spec.md Assumptions: the code must be exactly PASSWORD_RESET_CODE_LENGTH (6)
  // digits — non-digit characters and the wrong length are both rejected, mirroring
  // verificationCodeSchema's regex-based approach above.
  it("rejects a code containing non-digit characters", () => {
    const result = resetPasswordWithCodeSchema.safeParse({ ...validInput, code: "12a456" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const codeIssue = result.error.issues.find((issue) => issue.path[0] === "code");
      expect(codeIssue?.message).toBe("Enter the 6-digit code");
    }
  });

  it("rejects a code with the wrong length", () => {
    expect(resetPasswordWithCodeSchema.safeParse({ ...validInput, code: "12345" }).success).toBe(
      false
    );
  });

  // 005-login FR-008: reuses the shared passwordSchema (T001) — same 8-character minimum as
  // registration, not a separately-maintained rule.
  it("rejects a password shorter than 8 characters with passwordSchema's shared message", () => {
    const result = resetPasswordWithCodeSchema.safeParse({ ...validInput, password: "short1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordIssue = result.error.issues.find((issue) => issue.path[0] === "password");
      expect(passwordIssue?.message).toBe("Password must be at least 8 characters");
    }
  });
});

describe("verificationCodeSchema", () => {
  // FR-002: happy path.
  it("accepts a 5-digit code", () => {
    expect(verificationCodeSchema.safeParse({ code: "12345" }).success).toBe(true);
  });

  // FR-002: validation-error path — non-digit characters are rejected, not just wrong length.
  it("rejects a code containing non-digit characters", () => {
    expect(verificationCodeSchema.safeParse({ code: "12a4b" }).success).toBe(false);
  });

  it("rejects a code with the wrong length", () => {
    expect(verificationCodeSchema.safeParse({ code: "1234" }).success).toBe(false);
  });
});

describe("profileFormSchema", () => {
  const validPersonalInput = {
    nombre: "Ana",
    apellidoPaterno: "Garcia",
    birthDate: "1990-01-01",
    nationality: "MX",
    curp: "GARA900101MDFXXX01",
    rfc: "GARA900101ABC",
    tosAccepted: true as const,
    privacyAccepted: true as const,
  };

  // FR-004: happy path — apellidoMaterno omitted entirely (optional).
  it("accepts a valid profile payload with apellidoMaterno omitted", () => {
    expect(profileFormSchema.safeParse(validPersonalInput).success).toBe(true);
  });

  it("accepts a valid profile payload with apellidoMaterno present", () => {
    expect(
      profileFormSchema.safeParse({ ...validPersonalInput, apellidoMaterno: "Lopez" }).success
    ).toBe(true);
  });

  // FR-004: validation-error path — nombre is required.
  it("rejects a payload missing nombre", () => {
    const { nombre: _nombre, ...withoutNombre } = validPersonalInput;
    expect(profileFormSchema.safeParse(withoutNombre).success).toBe(false);
  });

  // FR-004: validation-error path — apellidoPaterno is required.
  it("rejects a payload missing apellidoPaterno", () => {
    const { apellidoPaterno: _apellidoPaterno, ...withoutApellidoPaterno } = validPersonalInput;
    expect(profileFormSchema.safeParse(withoutApellidoPaterno).success).toBe(false);
  });

  // FR-004 (ToS/privacy piece of FR-007): z.literal(true) rejects anything but an explicit
  // affirmative — false, undefined, or a truthy-but-not-literal-true value.
  it("rejects a payload where tosAccepted is false", () => {
    expect(
      profileFormSchema.safeParse({ ...validPersonalInput, tosAccepted: false }).success
    ).toBe(false);
  });

  it("rejects a payload where privacyAccepted is missing", () => {
    const { privacyAccepted: _privacyAccepted, ...withoutPrivacyAccepted } = validPersonalInput;
    expect(profileFormSchema.safeParse(withoutPrivacyAccepted).success).toBe(false);
  });

  // T032 (found by T021's manual smoke check, Defect 1): every user-reachable validator must
  // carry a custom message, never Zod's raw internal default.
  it("does not leak Zod's raw default message for a missing/empty username-adjacent field", () => {
    const result = usernameSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).not.toBe(
        "String must contain at least 1 character(s)"
      );
      expect(result.error.issues[0].message).toBe("Username is required");
    }
  });

  it("gives a specific too-long message for a username over 30 characters", () => {
    const result = usernameSchema.safeParse("a".repeat(31));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Username must be 30 characters or fewer");
    }
  });

  it("gives a custom message (not Zod's raw default) for an invalid email", () => {
    const result = personalRegistrationSchema.safeParse({
      email: "not-an-email",
      password: "supersecret1",
      phone: "+525512345678",
      username: "ana_garcia",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailIssue = result.error.issues.find((issue) => issue.path[0] === "email");
      expect(emailIssue?.message).toBe("Enter a valid email address");
    }
  });

  it("rejects tosAccepted: false with a custom message, not Zod's raw literal-mismatch default", () => {
    const result = profileFormSchema.safeParse({ ...validPersonalInput, tosAccepted: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      const tosIssue = result.error.issues.find((issue) => issue.path[0] === "tosAccepted");
      expect(tosIssue?.message).not.toBe("Invalid literal value, expected true");
      expect(tosIssue?.message).toBe("You must accept the Terms of Service");
    }
  });

  // T032 (Defect 2): apellidoMaterno's `.min(1).optional()` accepted `undefined` but not `""` —
  // the real-user path (type a value, then clear it back to "") produced "" from React Hook
  // Form, not undefined, and was incorrectly blocked. An empty string must now be accepted and
  // normalized to `undefined` (so the wire payload omits the key rather than sending "").
  it("accepts an empty apellidoMaterno and normalizes it to undefined (type-then-clear path)", () => {
    const result = profileFormSchema.safeParse({ ...validPersonalInput, apellidoMaterno: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apellidoMaterno).toBeUndefined();
    }
  });

  it("accepts a whitespace-only apellidoMaterno and normalizes it to undefined", () => {
    const result = profileFormSchema.safeParse({ ...validPersonalInput, apellidoMaterno: "   " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apellidoMaterno).toBeUndefined();
    }
  });

  // Same latent bug, same fix, for the base schema's optional commercialName/fiscalAddress
  // (businessProfileFormSchema overrides both to required — see that schema's own tests below).
  it("accepts an empty commercialName/fiscalAddress on the base (non-business) schema and normalizes to undefined", () => {
    const result = profileFormSchema.safeParse({
      ...validPersonalInput,
      commercialName: "",
      fiscalAddress: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.commercialName).toBeUndefined();
      expect(result.data.fiscalAddress).toBeUndefined();
    }
  });
});

describe("businessProfileFormSchema", () => {
  const validBusinessInput = {
    nombre: "Ana",
    apellidoPaterno: "Garcia",
    birthDate: "1990-01-01",
    nationality: "MX",
    curp: "GARA900101MDFXXX01",
    rfc: "GARA900101ABC",
    tosAccepted: true as const,
    privacyAccepted: true as const,
    commercialName: "Tienda Ana",
    fiscalAddress: "Calle Falsa 123, CDMX",
  };

  // FR-003: happy path — business fields present alongside the standard personal fields.
  it("accepts a valid business profile payload", () => {
    expect(businessProfileFormSchema.safeParse(validBusinessInput).success).toBe(true);
  });

  // FR-003: validation-error path — commercialName is required for business accounts (not
  // required at all by the base profileFormSchema).
  it("rejects a business payload missing commercialName", () => {
    const { commercialName: _commercialName, ...withoutCommercialName } = validBusinessInput;
    expect(businessProfileFormSchema.safeParse(withoutCommercialName).success).toBe(false);
  });

  // FR-003, FR-004: validation-error path — fiscalAddress is required for business accounts.
  it("rejects a business payload missing fiscalAddress", () => {
    const { fiscalAddress: _fiscalAddress, ...withoutFiscalAddress } = validBusinessInput;
    expect(businessProfileFormSchema.safeParse(withoutFiscalAddress).success).toBe(false);
  });

  // FR-004: rfc itself (required by the base profileFormSchema, reused rather than duplicated
  // as a separate "business RFC" field — see schemas.ts's doc comment) is still required here.
  it("rejects a business payload missing rfc", () => {
    const { rfc: _rfc, ...withoutRfc } = validBusinessInput;
    expect(businessProfileFormSchema.safeParse(withoutRfc).success).toBe(false);
  });
});

// 010-registration-redesign T008 (FR-002, plan.md Research Decision 2): the combined Usuario-tab
// shape UsuarioForm validates against — a merge of the two existing, unchanged schemas above.
describe("usuarioCrearCuentaSchema", () => {
  const validInput = {
    email: "ana@example.com",
    password: "supersecret1",
    phone: "+525512345678",
    username: "ana_garcia",
    nombre: "Ana",
    apellidoPaterno: "Garcia",
    birthDate: "1990-01-01",
    nationality: "MX",
    curp: "GARA900101MDFXXX01",
    rfc: "GARA900101ABC",
    tosAccepted: true as const,
    privacyAccepted: true as const,
  };

  it("accepts a payload covering every Usuario-tab field (registration + profile fields combined)", () => {
    expect(usuarioCrearCuentaSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts apellidoMaterno omitted (genuinely optional, inherited from profileFormSchema)", () => {
    expect(usuarioCrearCuentaSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a payload missing a registration-side field (email)", () => {
    const { email: _email, ...withoutEmail } = validInput;
    expect(usuarioCrearCuentaSchema.safeParse(withoutEmail).success).toBe(false);
  });

  it("rejects a payload missing a profile-side field (nombre)", () => {
    const { nombre: _nombre, ...withoutNombre } = validInput;
    expect(usuarioCrearCuentaSchema.safeParse(withoutNombre).success).toBe(false);
  });
});

// 010-registration-redesign T008 (FR-003, plan.md Research Decision 2): the Tienda tab's own
// narrower profile-step shape — must NOT require any personal field profileFormSchema/
// businessProfileFormSchema would otherwise pull in.
describe("tiendaProfileFormSchema", () => {
  const validInput = {
    commercialName: "Tienda Ana",
    rfc: "GARA900101ABC",
    fiscalAddress: "Calle Falsa 123, CDMX",
    tosAccepted: true as const,
    privacyAccepted: true as const,
  };

  it("accepts a payload with exactly the Tienda profile fields, nothing else required", () => {
    expect(tiendaProfileFormSchema.safeParse(validInput).success).toBe(true);
  });

  it("does not require (or reject the absence of) any personal field", () => {
    const parsed = tiendaProfileFormSchema.parse(validInput);
    expect(parsed).not.toHaveProperty("nombre");
    expect(parsed).not.toHaveProperty("apellidoPaterno");
    expect(parsed).not.toHaveProperty("birthDate");
    expect(parsed).not.toHaveProperty("nationality");
    expect(parsed).not.toHaveProperty("curp");
  });

  it("rejects a payload missing commercialName", () => {
    const { commercialName: _commercialName, ...withoutCommercialName } = validInput;
    expect(tiendaProfileFormSchema.safeParse(withoutCommercialName).success).toBe(false);
  });

  it("rejects a payload missing rfc", () => {
    const { rfc: _rfc, ...withoutRfc } = validInput;
    expect(tiendaProfileFormSchema.safeParse(withoutRfc).success).toBe(false);
  });

  it("rejects a payload missing fiscalAddress", () => {
    const { fiscalAddress: _fiscalAddress, ...withoutFiscalAddress } = validInput;
    expect(tiendaProfileFormSchema.safeParse(withoutFiscalAddress).success).toBe(false);
  });
});

describe("tiendaCrearCuentaSchema", () => {
  const validInput = {
    email: "tienda@example.com",
    password: "supersecret1",
    phone: "+525512345678",
    username: "mi_tienda",
    commercialName: "Tienda Ana",
    rfc: "GARA900101ABC",
    fiscalAddress: "Calle Falsa 123, CDMX",
    tosAccepted: true as const,
    privacyAccepted: true as const,
  };

  it("accepts a payload covering every Tienda-tab field (registration + Tienda profile fields combined)", () => {
    expect(tiendaCrearCuentaSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a payload missing a registration-side field (username)", () => {
    const { username: _username, ...withoutUsername } = validInput;
    expect(tiendaCrearCuentaSchema.safeParse(withoutUsername).success).toBe(false);
  });

  it("rejects a payload missing a Tienda profile field (fiscalAddress)", () => {
    const { fiscalAddress: _fiscalAddress, ...withoutFiscalAddress } = validInput;
    expect(tiendaCrearCuentaSchema.safeParse(withoutFiscalAddress).success).toBe(false);
  });
});
