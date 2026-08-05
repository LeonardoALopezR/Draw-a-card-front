// Mirrors the backend's prisma/schema.prisma models. Plain TypeScript, no framework
// imports — portable to any future codebase (Constitution Principle IV).

export type KycStatus = "pending" | "verified" | "rejected";

export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  isBusiness: boolean;
  kycStatus: KycStatus;
  // Set once the FR-002 phone-verification code is confirmed; mirrors backend
  // User.phoneVerifiedAt. Also doubles as the "resumable registration" progress marker read
  // by resolveKycRoute()'s "verify-phone" branch (spec.md Edge Cases, FR-009).
  phoneVerifiedAt?: string | null;
  // FR-004 profile-step fields, mirroring the backend's User model field-for-field
  // (prisma/schema.prisma). All nullable until submitted via POST /identity/me/profile.
  // nombre + apellidoPaterno together are what resolveKycRoute()'s "profile" branch checks
  // for completeness (the backend's two required profile fields).
  nombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  birthDate?: string | null;
  nationality?: string | null;
  curp?: string | null;
  rfc?: string | null;
  // FR-004 ToS/privacy acceptance timestamps, mirroring backend User.tosAcceptedAt /
  // User.privacyAcceptedAt.
  tosAcceptedAt?: string | null;
  privacyAcceptedAt?: string | null;
  // Populated by the backend only when kycStatus is "rejected"; absent/null for
  // "pending"/"verified". NOTE: as of the 2026-08-04 re-scope, the backend's
  // 001-user-registration-kyc feature still has no rejected path at all (every registration
  // ends at kycStatus: "pending") and its User model has no equivalent column yet — this
  // field name is carried over verbatim from this feature's own spec.md Key Entities section
  // in anticipation of the (not-yet-spec'd) 002-kyc-document-verification backend feature.
  // Confirm the exact field name against that backend feature's spec once it exists. See
  // progress/impl_001-registration-kyc.md Run 2 for the original discrepancy writeup.
  kycRejectionReason?: string | null;
  // Backs FR-007 ("first-run tutorial shown only once"). NOT present on the backend's
  // current User model (confirmed against prisma/schema.prisma in the backend repo) — per
  // plan.md's Data Model section, this may need a local-storage (expo-secure-store/web)
  // fallback keyed by user id until/unless the backend exposes it. Flagged for whoever
  // implements T008/T019.
  hasCompletedTutorial: boolean;
  profileImageUrl?: string;
  bio?: string;
  isPremium: boolean;
}

export interface BusinessProfile {
  commercialName: string;
  rfc: string;
  fiscalAddress: string;
}

export interface Card {
  id: string;
  name: string;
  cardNumber: string;
  rarity?: string;
  imageUrl?: string;
  setId: string;
}

export interface PortfolioCard {
  id: string;
  cardId: string;
  card: Card;
  condition?: string;
  foil: boolean;
  grading?: string;
  quantity: number;
}

export interface Portfolio {
  id: string;
  name: string;
  isGeneral: boolean;
  isPrivate: boolean;
  totalValueCache: number;
  cards: PortfolioCard[];
}
