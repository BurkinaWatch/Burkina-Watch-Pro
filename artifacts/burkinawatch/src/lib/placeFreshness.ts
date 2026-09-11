import type { Place } from "@shared/schema";

export type PlaceFreshnessTone = "recent" | "confirm" | "old" | "contested";

export interface PlaceFreshness {
  tone: PlaceFreshnessTone;
  label: string;
  detail: string;
  checkedAt: Date | null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getPlaceFreshness(place: Partial<Place>): PlaceFreshness {
  const checkedAt = toDate(place.updatedAt || place.lastSyncedAt);
  const ageMs = checkedAt ? Math.max(0, Date.now() - checkedAt.getTime()) : null;
  const ageDays = ageMs === null ? null : ageMs / (24 * 60 * 60 * 1000);
  const reports = place.reports || 0;
  const confirmations = place.confirmations || 0;

  if (place.verificationStatus === "needs_review" || reports > confirmations) {
    return {
      tone: "contested",
      label: "Information contestée",
      detail: checkedAt ? `Dernière vérification il y a ${formatAge(ageMs!)}` : "Vérification nécessaire",
      checkedAt,
    };
  }

  if (ageDays === null) {
    return {
      tone: "confirm",
      label: "À confirmer",
      detail: "Aucune date de vérification fiable",
      checkedAt: null,
    };
  }

  if (ageDays <= 7 && (place.verificationStatus === "verified" || confirmations > 0)) {
    return {
      tone: "recent",
      label: "Vérifié récemment",
      detail: `Confirmé il y a ${formatAge(ageMs)}`,
      checkedAt,
    };
  }

  if (ageDays > 30) {
    return {
      tone: "old",
      label: "Information ancienne",
      detail: `Dernière vérification il y a ${formatAge(ageMs)}`,
      checkedAt,
    };
  }

  return {
    tone: "confirm",
    label: "À confirmer",
    detail: `Dernière vérification il y a ${formatAge(ageMs)}`,
    checkedAt,
  };
}

function formatAge(ageMs: number): string {
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "moins d’une minute";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} heure${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `${days} jour${days > 1 ? "s" : ""}`;
}

export function getFreshnessClasses(tone: PlaceFreshnessTone): string {
  switch (tone) {
    case "recent":
      return "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300";
    case "contested":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300";
    case "old":
      return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";
  }
}

export interface CurrentMobileMoneyStatus {
  label: string;
  tone: "available" | "warning" | "closed";
}

export function getCurrentMobileMoneyStatus(tags: Record<string, unknown>): CurrentMobileMoneyStatus | null {
  const checkedAt = toDate(tags.mobileMoneyCheckedAt || tags.liquiditeCheckedAt);
  if (!checkedAt || Date.now() - checkedAt.getTime() > 2 * 60 * 60 * 1000) return null;

  const rawStatus = String(tags.mobileMoneyStatus || tags.liquiditeStatus || "").toLowerCase();
  if (["retrait", "retrait disponible", "withdrawal_available"].includes(rawStatus)) {
    return { label: "Retrait disponible (confirmé récemment)", tone: "available" };
  }
  if (["depot", "dépôt", "deposit_available"].includes(rawStatus)) {
    return { label: "Dépôt disponible (confirmé récemment)", tone: "available" };
  }
  if (rawStatus.includes("liquid") || rawStatus.includes("indispon") || rawStatus.includes("probl")) {
    return { label: "Liquidité ou service à confirmer", tone: "warning" };
  }
  if (rawStatus.includes("fermé") || rawStatus.includes("ferme") || rawStatus.includes("closed")) {
    return { label: "Point fermé (confirmé récemment)", tone: "closed" };
  }
  return null;
}