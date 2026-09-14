import { and, desc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";
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
import { readStreetviewObject, writeStreetviewDataUrl } from "./streetviewStorage";

export const DEFAULT_PLACE_EXPERIENCE_CONFIG = {
  enabled: true,
  dwellThresholdSeconds: 15 * 60,
  radiusMeters: 75,
  maxSpeedMps: 2,
  minAccuracyMeters: 100,
  maxObservationGapSeconds: 10 * 60,
} as const;

export const DEFAULT_PLACE_EXPERIENCE_RETENTION_DAYS = 30;

export type PlaceExperienceConfig = {
  enabled: boolean;
  dwellThresholdSeconds: number;
  radiusMeters: number;
  maxSpeedMps: number;
  minAccuracyMeters: number;
  maxObservationGapSeconds: number;
};

export function isMissingOptionalPlaceExperienceTableError(error: unknown): boolean {
  const candidate = error as {
    code?: unknown;
    cause?: unknown;
  } | null;
  if (!candidate || typeof candidate !== "object") return false;
  if (candidate.code === "42P01") return true;
  return isMissingOptionalPlaceExperienceTableError(candidate.cause);
}

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
  let settings: typeof placeExperienceSettings["$inferSelect"] | undefined;
  try {
    [settings] = await db
      .select()
      .from(placeExperienceSettings)
      .where(eq(placeExperienceSettings.id, "default"))
      .limit(1);
  } catch (error) {
    if (isMissingOptionalPlaceExperienceTableError(error)) {
      return { ...DEFAULT_PLACE_EXPERIENCE_CONFIG, enabled: false };
    }
    throw error;
  }

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
  try {
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
  } catch (error) {
    if (isMissingOptionalPlaceExperienceTableError(error)) {
      return {
        enabled: false,
        locationPermissionGranted: false,
        pushSubscriptionActive: false,
        consent: null,
      };
    }
    throw error;
  }
}

export async function savePlaceExperienceConsent(
  userId: string,
  enabled: boolean,
  locationPermissionGranted: boolean,
): Promise<PlaceExperienceConsent> {
  return db.transaction(async (tx) => {
    if (!enabled) {
      const visits = await tx.select({ id: placeExperienceVisits.id })
        .from(placeExperienceVisits)
        .where(eq(placeExperienceVisits.userId, userId));
      const visitIds = visits.map(({ id }) => id);
      if (visitIds.length > 0) {
        await tx.execute(sql`
          UPDATE place_experiences
          SET user_id = NULL, visit_id = NULL, comment = NULL, anonymized_at = NOW()
          WHERE visit_id IN (${sql.join(visitIds.map((id) => sql`${id}`), sql`, `)})
        `);
        await tx.delete(placeExperienceVisits).where(inArray(placeExperienceVisits.id, visitIds));
      }
    }

    const [consent] = await tx
      .insert(placeExperienceConsents)
      .values({ userId, enabled, locationPermissionGranted })
      .onConflictDoUpdate({
        target: placeExperienceConsents.userId,
        set: { enabled, locationPermissionGranted, updatedAt: new Date() },
      })
      .returning();
    return consent;
  });
}

export async function purgeExpiredPlaceExperienceData(
  retentionDays = DEFAULT_PLACE_EXPERIENCE_RETENTION_DAYS,
  now = new Date(),
): Promise<{ visitsDeleted: number; experiencesAnonymized: number }> {
  const safeRetentionDays = Number.isInteger(retentionDays) && retentionDays > 0
    ? Math.min(retentionDays, 365)
    : DEFAULT_PLACE_EXPERIENCE_RETENTION_DAYS;
  const cutoff = new Date(now.getTime() - safeRetentionDays * 86_400_000);

  try {
    return await db.transaction(async (tx) => {
      const expired = await tx.select({ id: placeExperienceVisits.id })
        .from(placeExperienceVisits)
        .where(lt(placeExperienceVisits.lastSeenAt, cutoff));
      const visitIds = expired.map(({ id }) => id);
      if (visitIds.length === 0) return { visitsDeleted: 0, experiencesAnonymized: 0 };

      const anonymized = await tx.execute(sql`
        UPDATE place_experiences
        SET user_id = NULL, visit_id = NULL, comment = NULL, anonymized_at = ${now}
        WHERE visit_id IN (${sql.join(visitIds.map((id) => sql`${id}`), sql`, `)})
        RETURNING id
      `);
      const deleted = await tx.delete(placeExperienceVisits)
        .where(inArray(placeExperienceVisits.id, visitIds))
        .returning({ id: placeExperienceVisits.id });
      return { visitsDeleted: deleted.length, experiencesAnonymized: anonymized.rows.length };
    });
  } catch (error: any) {
    if (isMissingOptionalPlaceExperienceTableError(error)) {
      console.warn("Place experience retention skipped: optional tables are not published in this database");
      return { visitsDeleted: 0, experiencesAnonymized: 0 };
    }
    throw error;
  }
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

  let visit: PlaceExperienceVisit | undefined;
  try {
    visit = activeVisit
      ? (await db.update(placeExperienceVisits)
        .set({ ...visitValues, updatedAt: new Date() })
        .where(and(
          eq(placeExperienceVisits.id, activeVisit.id),
          inArray(placeExperienceVisits.status, ["observing", "eligible"]),
        ))
        .returning())[0]
      : (await db.insert(placeExperienceVisits).values(visitValues).returning())[0];
  } catch (error: any) {
    if (error?.code === "23505" && !activeVisit) {
      const concurrentVisit = await getActiveVisit(userId, place.id);
      if (concurrentVisit) return recordPresence(userId, observation, config);
    }
    throw error;
  }
  if (!visit) return recordPresence(userId, observation, config);

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
  if (!visit || !visit.checkInTriggeredAt || visit.status !== "eligible") return { outcome: "not_found" };

  try {
    return await db.transaction(async (tx) => {
      const [existingExperience] = await tx.select({ id: placeExperiences.id })
        .from(placeExperiences)
        .where(and(
          eq(placeExperiences.visitId, visit.id),
          eq(placeExperiences.userId, input.userId),
        ))
        .limit(1);
      if (existingExperience) return { outcome: "duplicate" as const };

      const [experience] = await tx.insert(placeExperiences).values({
        visitId: visit.id,
        userId: input.userId,
        placeId: visit.placeId,
        candidateId: visit.candidateId,
        perception: input.perception,
        reasonCodes: input.reasonCodes ?? null,
        comment: input.comment ?? null,
      }).returning();

      await tx.update(placeExperienceVisits)
        .set({ status: "checked_in", updatedAt: new Date() })
        .where(and(
          eq(placeExperienceVisits.id, visit.id),
          eq(placeExperienceVisits.status, "eligible"),
        ));

      return { outcome: "created" as const, experience };
    });
  } catch (error: any) {
    if (error?.code === "23505") return { outcome: "duplicate" };
    throw error;
  }
}

export async function deferPlaceExperience(userId: string, visitId: string): Promise<PlaceExperienceVisit | null> {
  const visit = await getOwnedVisit(userId, visitId);
  if (!visit || !visit.checkInTriggeredAt || visit.status !== "eligible") return null;
  const [updated] = await db.update(placeExperienceVisits)
    .set({ status: "deferred", updatedAt: new Date() })
    .where(and(
      eq(placeExperienceVisits.id, visit.id),
      eq(placeExperienceVisits.status, "eligible"),
    ))
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

export async function attachPlaceExperienceCandidateMedia(
  userId: string,
  candidateId: string,
  dataUrl: string,
): Promise<PlaceExperienceCandidate | null> {
  const candidate = await getOwnedCandidate(userId, candidateId);
  if (!candidate) return null;
  const storageKey = `place-experience/candidates/${candidateId}/photo.jpg`;
  await writeStreetviewDataUrl(storageKey, dataUrl, 5 * 1024 * 1024);
  const [updated] = await db.update(placeExperienceCandidates)
    .set({ mediaUrl: `/api/place-experience/candidates/${candidateId}/media`, updatedAt: new Date() })
    .where(and(eq(placeExperienceCandidates.id, candidateId), eq(placeExperienceCandidates.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function readPlaceExperienceCandidateMedia(candidateId: string): Promise<Buffer> {
  return readStreetviewObject(`place-experience/candidates/${candidateId}/photo.jpg`);
}

export function canReadPlaceExperienceCandidateMedia(
  candidate: Pick<PlaceExperienceCandidate, "status" | "userId">,
  viewer?: { claims?: { sub?: string }; role?: string } | null,
): boolean {
  const isModerator = ["admin", "moderateur", "moderator"].includes(viewer?.role ?? "");
  return candidate.status === "APPROVED" ||
    candidate.userId === viewer?.claims?.sub ||
    isModerator;
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

export async function getPlaceExperienceCandidate(candidateId: string): Promise<PlaceExperienceCandidate | null> {
  const [candidate] = await db.select()
    .from(placeExperienceCandidates)
    .where(eq(placeExperienceCandidates.id, candidateId))
    .limit(1);
  return candidate ?? null;
}

/**
 * Public, deliberately minimized view of place experience data.  This function
 * never selects a visit, user, comment, or coordinate.
 */
export async function getPlaceExperienceContext(placeId: string) {
  const [place] = await db.select({
    id: places.id,
    name: places.name,
    placeType: places.placeType,
  }).from(places).where(eq(places.id, placeId)).limit(1);
  if (!place) return null;

  let perceptions: Array<{ perception: string; createdAt: Date }> = [];
  try {
    perceptions = await db.select({
      perception: placeExperiences.perception,
      createdAt: placeExperiences.createdAt,
    }).from(placeExperiences)
      .where(and(eq(placeExperiences.placeId, placeId), eq(placeExperiences.processingStatus, "recorded")))
      .orderBy(desc(placeExperiences.createdAt)).limit(20);
  } catch (error: any) {
    // The additive phase 1 tables may not exist until the owner's planned
    // schema publication. Keep the public context useful with existing data.
    if (error?.cause?.code !== "42P01" && error?.code !== "42P01") throw error;
  }

  const now = Date.now();
  const recentDataWindowMs = 30 * 86_400_000;
  const freshness = (date: Date | null) => {
    if (!date) return "date inconnue";
    const ageDays = Math.max(0, Math.floor((now - date.getTime()) / 86_400_000));
    return ageDays === 0 ? "aujourd'hui" : ageDays === 1 ? "il y a 1 jour" : `il y a ${ageDays} jours`;
  };
  return {
    place,
    disclaimer: "Informations communautaires, sans score de sécurité ni garantie.",
    hasRecentData: perceptions.some((item) => now - item.createdAt.getTime() <= recentDataWindowMs),
    insufficientData: perceptions.length === 0,
    perceptions: perceptions.map((item) => ({
      type: "perception" as const,
      perception: item.perception,
      source: "Contribution citoyenne",
      sourceType: "community",
      status: "Information non confirmée",
      observedAt: item.createdAt,
      freshness: freshness(item.createdAt),
    })),
  };
}

export async function listPlaceExperienceCandidates(status = "PENDING") {
  return db.select().from(placeExperienceCandidates)
    .where(eq(placeExperienceCandidates.status, status))
    .orderBy(desc(placeExperienceCandidates.createdAt)).limit(100);
}

export async function moderatePlaceExperienceCandidate(input: {
  candidateId: string;
  status: "APPROVED" | "REJECTED";
  moderatorId: string;
  note?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [candidate] = await tx.update(placeExperienceCandidates)
      .set({
        status: input.status,
        moderationNote: input.note ?? null,
        moderatedAt: new Date(),
        moderatedBy: input.moderatorId,
        updatedAt: new Date(),
      })
      .where(and(eq(placeExperienceCandidates.id, input.candidateId), eq(placeExperienceCandidates.status, "PENDING")))
      .returning();
    if (!candidate) return null;
    if (input.status !== "APPROVED" || candidate.associatedPlaceId) return candidate;

    const [place] = await tx.insert(places).values({
      osmId: `community:${candidate.id}`,
      osmType: "community_candidate",
      placeType: candidate.category,
      name: candidate.name,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      imageUrl: candidate.mediaUrl,
      source: "COMMUNAUTE",
      confidenceScore: "0.50",
      verificationStatus: "verified",
    }).returning({ id: places.id });
    if (!place) return candidate;

    const [linkedCandidate] = await tx.update(placeExperienceCandidates)
      .set({ associatedPlaceId: place.id, updatedAt: new Date() })
      .where(eq(placeExperienceCandidates.id, candidate.id))
      .returning();
    return linkedCandidate ?? candidate;
  });
}