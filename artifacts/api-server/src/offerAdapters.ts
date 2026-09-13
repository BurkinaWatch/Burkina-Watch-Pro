/**
 * Contrats d'ingestion des offres.
 *
 * Cette couche ne réalise aucun scraping et aucun contournement de protection.
 * Un connecteur futur devra fournir une méthode d'accès autorisée, puis passer
 * par normalizeOffer avant validation et persistance.
 */

export type OfferSourceKind = "INTERNAL" | "OFFICIAL" | "EXTERNAL" | "RSS" | "USER";

export type RawOfferInput = {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  price?: unknown;
  currency?: unknown;
  zone?: unknown;
  availability?: unknown;
  phone?: unknown;
  whatsapp?: unknown;
  sourceUrl?: unknown;
  sourceName?: unknown;
  placeId?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  mediaUrl?: unknown;
};

export type NormalizedOfferInput = {
  title: string;
  description: string;
  category: string;
  price?: number;
  currency: string;
  zone?: string;
  availability?: string;
  phone?: string;
  whatsapp?: string;
  sourceUrl?: string;
  sourceName?: string;
  placeId?: string;
  startsAt?: Date;
  endsAt?: Date;
  mediaUrl?: string;
};

export type OfferSourceAdapter = {
  kind: OfferSourceKind;
  name: string;
  accessPolicy: "authorized_only";
  normalize(input: RawOfferInput): NormalizedOfferInput;
};

const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;

export function normalizeOffer(input: RawOfferInput): NormalizedOfferInput {
  const title = text(input.title);
  const description = text(input.description);
  const category = text(input.category);
  if (!title || !description || !category) {
    throw new Error("Une offre normalisée doit avoir un titre, une description et une catégorie.");
  }

  const numericPrice = typeof input.price === "number"
    ? input.price
    : typeof input.price === "string" && /^\d+$/.test(input.price.trim())
      ? Number(input.price.trim())
      : undefined;

  const parseDate = (value: unknown) => {
    if (!value) return undefined;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  return {
    title,
    description,
    category,
    ...(numericPrice !== undefined ? { price: numericPrice } : {}),
    currency: text(input.currency) || "XOF",
    ...(text(input.zone) ? { zone: text(input.zone) } : {}),
    ...(text(input.availability) ? { availability: text(input.availability) } : {}),
    ...(text(input.phone) ? { phone: text(input.phone) } : {}),
    ...(text(input.whatsapp) ? { whatsapp: text(input.whatsapp) } : {}),
    ...(text(input.sourceUrl) ? { sourceUrl: text(input.sourceUrl) } : {}),
    ...(text(input.sourceName) ? { sourceName: text(input.sourceName) } : {}),
    ...(text(input.placeId) ? { placeId: text(input.placeId) } : {}),
    ...(parseDate(input.startsAt) ? { startsAt: parseDate(input.startsAt) } : {}),
    ...(parseDate(input.endsAt) ? { endsAt: parseDate(input.endsAt) } : {}),
    ...(text(input.mediaUrl) ? { mediaUrl: text(input.mediaUrl) } : {}),
  };
}

export const internalOfferAdapter: OfferSourceAdapter = {
  kind: "INTERNAL",
  name: "BurkinaWatch interne",
  accessPolicy: "authorized_only",
  normalize: normalizeOffer,
};