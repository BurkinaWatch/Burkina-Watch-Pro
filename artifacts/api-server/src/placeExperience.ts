import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  placeExperienceCandidates,
  placeExperienceConsents,
  placeExperienceSettings,
  placeExperienceVisits,
  placeExperiences,
  places,
  pushSubscriptions,
  type Place,
  type PlaceExperienceCandidate,
  type PlaceExperienceConsent,
  type PlaceExperience,
  type PlaceExperienceVisit,
} from "@workspace/db";

export const DEFAULT_PLACE_EXPERIENCE_CONFIG = {
  enabled: true,
  dwellThresholdSeconds: 15 * 60,
  radiusMeters: 75,
  maxSpeedMps: 2,
  minAccuracyMeters: 100,
  maxObservationGapSeconds: 10 * 60,
} as const;

export type PlaceExperienceConfig = {
  enabled: boolean;
  dwellThresholdSeconds: number;
  radiusMeters: number;
  maxSpeedMps: number;
  minAccuracyMeters: number;
  maxObservationGapSeconds: number;
};

export type PresenceDecisionReason =
  | "eligible"
  | "already_triggered"
  | "moving"
  | "inaccurate"
  | "too_short";

export type PresenceEvaluation = {
  eligible: boolean;
  reason: PresenceDecisionReason;
  durationSeconds: number;
};

export type PlaceExperienceReadiness = {
  enabled: boolean;
  locationPermissionGranted: boolean;
  pushSubscriptionActive: boolean;
};

export const placeExperiencePresenceInputSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracyMeters: z.coerce.number().finite().nonnegative().max(10_000).optional().nullable(),
  speedMps: z.coerce.number().finite().nonnegative().max(100).optional().nullable(),
});

export const placeExperienceConsentInputSchema = z.object({
  enabled: z.boolean(),
  locationPermissionGranted: z.boolean(),
});

export const placeExperienceResponseInputSchema = z.object({
  perception: z.enum(["SAFE", "UNCERTAIN", "UNSAFE"]),
  reasonCodes: z.array(z.string().trim().min(1).max(50)).max(8).optional().nullable(),
  comment: z.string().trim().max(1000).optional().nullable(),
});

export type PresenceObservation = {
  startedAt: Date;
  observedAt: Date;
  speedMps?: number | null;
  accuracyMeters?: number | null;
};

export type PresenceSessionEvaluation = {
  startedAt: Date;
  evaluation: PresenceEvaluation;
  invalidatedDwell: boolean;
  reportedReason: PresenceDecisionReason;
};

export function getPlaceExperienceBlockReason(
  config: Pick<PlaceExperienceConfig, "enabled">,
  readiness: PlaceExperienceReadiness,
): "feature_disabled" | "consent_required" | "location_permission_required" | "push_subscription_required" | null {
  if (!config.enabled) return "feature_disabled";
  if (!readiness.enabled) return "consent_required";
  if (!readiness.locationPermissionGranted) return "location_permission_required";
  if (!readiness.pushSubscriptionActive) return "push_subscription_required";
  return null;
}

export function shouldTriggerCheckIn(
  evaluation: PresenceEvaluation,
  checkInTriggeredAt: Date | null | undefined,
): boolean {
  return evaluation.eligible && !checkInTriggeredAt;
}

export type PresenceResult = {
  visit: PlaceExperienceVisit;
  place: Place | null;
  placeState: "known" | "new" | "unmapped";
  previouslyVisited: boolean;
  checkInEligible: boolean;
  reason: PresenceDecisionReason | "no_place_nearby";
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function distanceMeters(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
): number {
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = (second.latitude - first.latitude) * Math.PI / 180;
  const longitudeDelta = (second.longitude - first.longitude) * Math.PI / 180;
  const firstLatitude = first.latitude * Math.PI / 180;
  const secondLatitude = second.latitude * Math.PI / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) *
    Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function evaluatePresence(
  observation: PresenceObservation,
  config: Pick<PlaceExperienceConfig, "dwellThresholdSeconds" | "maxSpeedMps" | "minAccuracyMeters">,
): PresenceEvaluation {
  const durationSeconds = Math.max(
    0,
    Math.floor((observation.observedAt.getTime() - observation.startedAt.getTime()) / 1000),
  );

  if (observation.speedMps !== null && observation.speedMps !== undefined &&
      observation.speedMps > config.maxSpeedMps) {
    return { eligible: false, reason: "moving", durationSeconds: 0 };
  }

  if (observation.accuracyMeters !== null && observation.accuracyMeters !== undefined &&
      observation.accuracyMeters > config.minAccuracyMeters) {
    return { eligible: false, reason: "inaccurate", durationSeconds: 0 };
  }

  if (durationSeconds < config.dwellThresholdSeconds) {
    return { eligible: false, reason: "too_short", durationSeconds };
  }

  return { eligible: true, reason: "eligible", durationSeconds };
}

export function evaluatePresenceSession(
  activeVisit: Pick<PlaceExperienceVisit, "startedAt" | "lastSeenAt" | "checkInTriggeredAt"> | null,
  observation: Omit<PresenceObservation, "startedAt">,
  config: PlaceExperienceConfig,
): PresenceSessionEvaluation {
  const gapSeconds = activeVisit?.lastSeenAt
    ? Math.max(0, (observation.observedAt.getTime() - activeVisit.lastSeenAt.getTime()) / 1000)
    : 0;
  const startedAt = activeVisit && gapSeconds <= config.maxObservationGapSeconds
    ? activeVisit.startedAt
    : observation.observedAt;
  const initialEvaluation = evaluatePresence({
    startedAt,
    ...observation,
  }, config);
  const invalidatedDwell =
    Boolean(activeVisit && !activeVisit.checkInTriggeredAt) &&
    (initialEvaluation.reason === "moving" || initialEvaluation.reason === "inaccurate");
  const effectiveStartedAt = invalidatedDwell ? observation.observedAt : startedAt;
  const evaluation = invalidatedDwell
    ? evaluatePresence({
        startedAt: effectiveStartedAt,
        ...observation,
      }, config)
    : initialEvaluation;

  return {
    startedAt: effectiveStartedAt,
    evaluation,
    invalidatedDwell,
    reportedReason: invalidatedDwell ? initialEvaluation.reason : evaluation.reason,
  };
}

export async function getPlaceExperienceConfig(): Promise<PlaceExperienceConfig> {
  const [settings] = await db
    .select()
    .from(placeExperienceSettings)
    .where(eq(placeExperienceSettings.id, "default"))
    .limit(1);

  if (!settings) {
    return { ...DEFAULT_PLACE_EXPERIENCE_CONFIG };
  }

  return {
    enabled: settings.enabled,
    dwellThresholdSeconds: settings.dwellThresholdSeconds,
    radiusMeters: settings.radiusMeters,
    maxSpeedMps: toFiniteNumber(settings.maxSpeedMps) ?? DEFAULT_PLACE_EXPERIENCE_CONFIG.maxSpeedMps,
    minAccuracyMeters: settings.minAccuracyMeters,
    maxObservationGapSeconds: settings.maxObservationGapSeconds,
  };
}

export async function getPlaceExperienceReadiness(userId: string): Promise<{
  enabled: boolean;
  locationPermissionGranted: boolean;
  pushSubscriptionActive: boolean;
  consent: PlaceExperienceConsent | null;
}> {
  const [[consent], [subscription]] = await Promise.all([
    db.select().from(placeExperienceConsents)
      .where(eq(placeExperienceConsents.userId, userId))
      .limit(1),
    db.select({ id: pushSubscriptions.id }).from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true),
      ))
      .limit(1),
  ]);

  return {
    enabled: consent?.enabled ?? false,
    locationPermissionGranted: consent?.locationPermissionGranted ?? false,
    pushSubscriptionActive: Boolean(subscription),
    consent: consent ?? null,
  };
}

export async function savePlaceExperienceConsent(
  userId: string,
  enabled: boolean,
  locationPermissionGranted: boolean,
): Promise<PlaceExperienceConsent> {
  const [consent] = await db
    .insert(placeExperienceConsents)
    .values({ userId, enabled, locationPermissionGranted })
    .onConflictDoUpdate({
      target: placeExperienceConsents.userId,
      set: { enabled, locationPermissionGranted, updatedAt: new Date() },
    })
    .returning();

  return consent;
}

async function findNearestPlace(
  latitude: number,
  longitude: number,
  radiusMeters: number,
): Promise<Place | null> {
  const latitudeDelta = radiusMeters / 111_320;
  const longitudeDelta = radiusMeters / (111_320 * Math.max(Math.cos(latitude * Math.PI / 180), 0.2));
  const candidates = await db
    .select()
    .from(places)
    .where(and(
      gte(places.latitude, String(latitude - latitudeDelta)),
      lte(places.latitude, String(latitude + latitudeDelta)),
      gte(places.longitude, String(longitude - longitudeDelta)),
      lte(places.longitude, String(longitude + longitudeDelta)),
    ))
    .limit(100);

  return candidates
    .map((place) => ({
      place,
      distance: distanceMeters(
        { latitude, longitude },
        { latitude: Number(place.latitude), longitude: Number(place.longitude) },
      ),
    }))
    .filter(({ distance }) => distance <= radiusMeters)
    .sort((left, right) => left.distance - right.distance)[0]?.place ?? null;
}

async function hasPriorVisit(userId: string, placeId: string): Promise<boolean> {
  const [visit] = await db
    .select({ id: placeExperienceVisits.id })
    .from(placeExperienceVisits)
    .where(and(
      eq(placeExperienceVisits.userId, userId),
      eq(placeExperienceVisits.placeId, placeId),
      inArray(placeExperienceVisits.status, ["checked_in", "deferred", "closed"]),
    ))
    .limit(1);
  return Boolean(visit);
}

async function getActiveVisit(userId: string, placeId: string): Promise<PlaceExperienceVisit | null> {
  const [visit] = await db
    .select()
    .from(placeExperienceVisits)
    .where(and(
      eq(placeExperienceVisits.userId, userId),
      eq(placeExperienceVisits.placeId, placeId),
      inArray(placeExperienceVisits.status, ["observing", "eligible"]),
    ))
    .orderBy(desc(placeExperienceVisits.lastSeenAt))
    .limit(1);
  return visit ?? null;
}

export async function recordPresence(
  userId: string,
  observation: {
    latitude: number;
    longitude: number;
    observedAt: Date;
    accuracyMeters?: number | null;
    speedMps?: number | null;
  },
  config: PlaceExperienceConfig,
): Promise<PresenceResult | null> {
  const place = await findNearestPlace(observation.latitude, observation.longitude, config.radiusMeters);
  if (!place) return null;

  const previousVisit = await hasPriorVisit(userId, place.id);
  const activeVisit = await getActiveVisit(userId, place.id);
  const sessionEvaluation = evaluatePresenceSession(activeVisit, observation, config);
  const { startedAt, evaluation, invalidatedDwell } = sessionEvaluation;
  const nextStatus = evaluation.eligible ? "eligible" : "observing";
  const shouldTrigger = shouldTriggerCheckIn(evaluation, activeVisit?.checkInTriggeredAt);
  const visitValues = {
    userId,
    placeId: place.id,
    startedAt,
    lastSeenAt: observation.observedAt,
    estimatedDurationSeconds: evaluation.durationSeconds,
    lastLatitude: String(observation.latitude),
    lastLongitude: String(observation.longitude),
    lastAccuracyMeters: observation.accuracyMeters == null ? null : String(observation.accuracyMeters),
    lastSpeedMps: observation.speedMps == null ? null : String(observation.speedMps),
    status: nextStatus,
    ...(shouldTrigger ? { checkInTriggeredAt: observation.observedAt } : {}),
  };

  const visit = activeVisit
    ? (await db.update(placeExperienceVisits)
      .set({ ...visitValues, updatedAt: new Date() })
      .where(eq(placeExperienceVisits.id, activeVisit.id))
      .returning())[0]
    : (await db.insert(placeExperienceVisits).values(visitValues).returning())[0];

  return {
    visit,
    place,
    placeState: previousVisit ? "known" : "new",
    previouslyVisited: previousVisit,
    checkInEligible: shouldTrigger,
    reason: shouldTrigger
      ? "eligible"
      : activeVisit?.checkInTriggeredAt
        ? "already_triggered"
        : invalidatedDwell
          ? sessionEvaluation.reportedReason
          : evaluation.reason,
  };
}

export async function getOwnedVisit(userId: string, visitId: string): Promise<PlaceExperienceVisit | null> {
  const [visit] = await db
    .select()
    .from(placeExperienceVisits)
    .where(and(eq(placeExperienceVisits.id, visitId), eq(placeExperienceVisits.userId, userId)))
    .limit(1);
  return visit ?? null;
}

export type RecordPlaceExperienceResult =
  | { outcome: "created"; experience: PlaceExperience }
  | { outcome: "not_found" }
  | { outcome: "duplicate" };

export async function recordPlaceExperience(input: {
  userId: string;
  visitId: string;
  perception: "SAFE" | "UNCERTAIN" | "UNSAFE";
  reasonCodes?: string[] | null;
  comment?: string | null;
}): Promise<RecordPlaceExperienceResult> {
  const visit = await getOwnedVisit(input.userId, input.visitId);
  if (!visit || !visit.checkInTriggeredAt) return { outcome: "not_found" };

  const [existingExperience] = await db.select({ id: placeExperiences.id })
    .from(placeExperiences)
    .where(and(
      eq(placeExperiences.visitId, visit.id),
      eq(placeExperiences.userId, input.userId),
    ))
    .limit(1);
  if (existingExperience) return { outcome: "duplicate" };

  const [experience] = await db.insert(placeExperiences).values({
    visitId: visit.id,
    userId: input.userId,
    placeId: visit.placeId,
    candidateId: visit.candidateId,
    perception: input.perception,
    reasonCodes: input.reasonCodes ?? null,
    comment: input.comment ?? null,
  }).returning();

  await db.update(placeExperienceVisits)
    .set({ status: "checked_in", updatedAt: new Date() })
    .where(eq(placeExperienceVisits.id, visit.id));

  return { outcome: "created", experience };
}

export async function deferPlaceExperience(userId: string, visitId: string): Promise<PlaceExperienceVisit | null> {
  const visit = await getOwnedVisit(userId, visitId);
  if (!visit || !visit.checkInTriggeredAt) return null;
  const [updated] = await db.update(placeExperienceVisits)
    .set({ status: "deferred", updatedAt: new Date() })
    .where(eq(placeExperienceVisits.id, visit.id))
    .returning();
  return updated ?? null;
}

export async function createPlaceExperienceCandidate(input: {
  userId: string;
  associatedPlaceId?: string | null;
  name: string;
  category: string;
  description?: string | null;
  latitude: string;
  longitude: string;
  mediaUrl?: string | null;
}) {
  const [candidate] = await db.insert(placeExperienceCandidates).values({
    ...input,
    source: "PLACE_EXPERIENCE",
    status: "PENDING",
  }).returning();
  return candidate;
}

export async function getOwnedCandidate(userId: string, candidateId: string): Promise<PlaceExperienceCandidate | null> {
  const [candidate] = await db.select()
    .from(placeExperienceCandidates)
    .where(and(
      eq(placeExperienceCandidates.id, candidateId),
      eq(placeExperienceCandidates.userId, userId),
    ))
    .limit(1);
  return candidate ?? null;
}