// Mirrors the backend's prisma/schema.prisma models. Keep these in sync manually for now;
// consider generating this file from the backend's OpenAPI/Prisma schema once both repos
// stabilize (see Constitution Principle I — backend is the source of truth).

export type KycStatus = "pending" | "verified" | "rejected";

export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  isBusiness: boolean;
  kycStatus: KycStatus;
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
