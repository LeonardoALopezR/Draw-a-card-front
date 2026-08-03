import { z } from "zod";

// Plain TypeScript + Zod, no framework imports — portable to any future codebase.
// Keep in sync with the backend's validation rules (see specs/001-registration-kyc).

export const personalRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  username: z.string().min(3).max(30),
});

export const businessRegistrationSchema = personalRegistrationSchema.extend({
  commercialName: z.string().min(1, "Commercial name is required"),
  rfc: z.string().min(12, "Enter a valid RFC"),
  fiscalAddress: z.string().min(1, "Fiscal address is required"),
});

export const verificationCodeSchema = z.object({
  code: z.string().length(5, "Enter the 5-digit code"),
});

export const kycFormSchema = z.object({
  curpRfc: z.string().min(1),
  officialIdUrl: z.string().url(),
  proofOfLifeUrl: z.string().url(),
  domicileAddress: z.string().min(1),
  acceptedTerms: z.literal(true),
  acceptedPrivacyPolicy: z.literal(true),
});

export type PersonalRegistrationInput = z.infer<typeof personalRegistrationSchema>;
export type BusinessRegistrationInput = z.infer<typeof businessRegistrationSchema>;
export type KycFormInput = z.infer<typeof kycFormSchema>;
