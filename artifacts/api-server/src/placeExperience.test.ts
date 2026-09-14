import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import express from "express";
import {
  canReadPlaceExperienceCandidateMedia,
  DEFAULT_PLACE_EXPERIENCE_CONFIG,
  distanceMeters,
  evaluatePresence,
  evaluatePresenceSession,
  getPlaceExperienceBlockReason,
  placeExperienceConsentInputSchema,
  placeExperiencePresenceInputSchema,
  placeExperienceResponseInputSchema,
  readPlaceExperienceCandidateMedia,
  shouldTriggerCheckIn,
} from "./placeExperience";
import { requireAuthenticatedUser } from "./authorization";
import { insertPlaceExperienceCandidateSchema } from "@workspace/db";
import {
  deleteStreetviewObject,
  writeStreetviewDataUrl,
} from "./streetviewStorage";
import { registerPlaceExperienceCandidateMediaRoute } from "./routes/routes";

const baseObservation = {
  startedAt: new Date("2026-09-13T10:00:00.000Z"),
  observedAt: new Date("2026-09-13T10:10:00.000Z"),
  speedMps: 0.3,
  accuracyMeters: 20,
};

test("le consentement, la permission de localisation et le push sont tous requis", () => {
  const config = { enabled: true };

  assert.equal(
    getPlaceExperienceBlockReason(config, {
      enabled: false,
      locationPermissionGranted: true,
      pushSubscriptionActive: true,
    }),
    "consent_required",
  );
  assert.equal(
    getPlaceExperienceBlockReason(config, {
      enabled: true,
      locationPermissionGranted: false,
      pushSubscriptionActive: true,
    }),
    "location_permission_required",
  );
  assert.equal(
    getPlaceExperienceBlockReason(config, {
      enabled: true,
      locationPermissionGranted: true,
      pushSubscriptionActive: false,
    }),
    "push_subscription_required",
  );
  assert.equal(
    getPlaceExperienceBlockReason(
      { enabled: false },
      {
        enabled: true,
        locationPermissionGranted: true,
        pushSubscriptionActive: true,
      },
    ),
    "feature_disabled",
  );
  assert.equal(
    getPlaceExperienceBlockReason(config, {
      enabled: true,
      locationPermissionGranted: true,
      pushSubscriptionActive: true,
    }),
    null,
  );
});

test("la distance utilise une tolérance géographique en mètres", () => {
  assert.equal(
    distanceMeters(
      { latitude: 12.3714, longitude: -1.5197 },
      { latitude: 12.3714, longitude: -1.5197 },
    ),
    0,
  );

  const oneDegreeLatitude = distanceMeters(
    { latitude: 12, longitude: -1 },
    { latitude: 13, longitude: -1 },
  );
  assert(oneDegreeLatitude > 110_000 && oneDegreeLatitude < 112_000);
  assert(
    distanceMeters(
      { latitude: 12.3714, longitude: -1.5197 },
      { latitude: 12.372, longitude: -1.5197 },
    ) < DEFAULT_PLACE_EXPERIENCE_CONFIG.radiusMeters,
  );
});

test("une présence devient éligible uniquement après la durée minimale", () => {
  const tooShort = evaluatePresence(baseObservation, DEFAULT_PLACE_EXPERIENCE_CONFIG);
  assert.equal(tooShort.eligible, false);
  assert.equal(tooShort.reason, "too_short");
  assert.equal(tooShort.durationSeconds, 600);

  const eligible = evaluatePresence(
    {
      ...baseObservation,
      observedAt: new Date("2026-09-13T10:15:00.000Z"),
    },
    DEFAULT_PLACE_EXPERIENCE_CONFIG,
  );
  assert.equal(eligible.eligible, true);
  assert.equal(eligible.reason, "eligible");
  assert.equal(eligible.durationSeconds, 900);
});

test("un déplacement rapide ou une précision insuffisante invalide la présence", () => {
  const moving = evaluatePresence(
    { ...baseObservation, speedMps: DEFAULT_PLACE_EXPERIENCE_CONFIG.maxSpeedMps + 0.1 },
    DEFAULT_PLACE_EXPERIENCE_CONFIG,
  );
  assert.deepEqual(moving, { eligible: false, reason: "moving", durationSeconds: 0 });

  const inaccurate = evaluatePresence(
    {
      ...baseObservation,
      accuracyMeters: DEFAULT_PLACE_EXPERIENCE_CONFIG.minAccuracyMeters + 1,
    },
    DEFAULT_PLACE_EXPERIENCE_CONFIG,
  );
  assert.deepEqual(inaccurate, { eligible: false, reason: "inaccurate", durationSeconds: 0 });
});

test("une observation invalide réinitialise la durée de la session active", () => {
  const activeVisit = {
    startedAt: new Date("2026-09-13T10:00:00.000Z"),
    lastSeenAt: new Date("2026-09-13T10:10:00.000Z"),
    checkInTriggeredAt: null,
  };
  const session = evaluatePresenceSession(
    activeVisit,
    {
      observedAt: new Date("2026-09-13T10:12:00.000Z"),
      speedMps: DEFAULT_PLACE_EXPERIENCE_CONFIG.maxSpeedMps + 1,
      accuracyMeters: 20,
    },
    DEFAULT_PLACE_EXPERIENCE_CONFIG,
  );

  assert.equal(session.invalidatedDwell, true);
  assert.equal(session.startedAt.toISOString(), "2026-09-13T10:12:00.000Z");
  assert.equal(session.evaluation.durationSeconds, 0);
  assert.equal(session.reportedReason, "moving");

  const nextStationaryObservation = evaluatePresenceSession(
    {
      ...activeVisit,
      startedAt: session.startedAt,
      lastSeenAt: session.startedAt,
    },
    {
      observedAt: new Date("2026-09-13T10:20:00.000Z"),
      speedMps: 0.1,
      accuracyMeters: 20,
    },
    DEFAULT_PLACE_EXPERIENCE_CONFIG,
  );
  assert.equal(nextStationaryObservation.evaluation.durationSeconds, 480);
  assert.equal(nextStationaryObservation.evaluation.reason, "too_short");
});

test("le check-in ne peut être déclenché qu'une seule fois", () => {
  const eligible = {
    eligible: true,
    reason: "eligible" as const,
    durationSeconds: DEFAULT_PLACE_EXPERIENCE_CONFIG.dwellThresholdSeconds,
  };
  const ineligible = {
    eligible: false,
    reason: "too_short" as const,
    durationSeconds: 0,
  };

  assert.equal(shouldTriggerCheckIn(eligible, null), true);
  assert.equal(shouldTriggerCheckIn(eligible, undefined), true);
  assert.equal(shouldTriggerCheckIn(eligible, new Date()), false);
  assert.equal(shouldTriggerCheckIn(ineligible, null), false);
});

test("les validateurs partagés rejettent les coordonnées et perceptions invalides", () => {
  assert.equal(
    placeExperienceConsentInputSchema.safeParse({
      enabled: true,
      locationPermissionGranted: true,
    }).success,
    true,
  );
  assert.equal(
    placeExperienceConsentInputSchema.safeParse({
      enabled: true,
      locationPermissionGranted: "yes",
    }).success,
    false,
  );
  assert.equal(
    placeExperiencePresenceInputSchema.safeParse({
      latitude: 12.37,
      longitude: -1.52,
      accuracyMeters: 20,
      speedMps: 0.2,
    }).success,
    true,
  );
  assert.equal(
    placeExperiencePresenceInputSchema.safeParse({
      latitude: 91,
      longitude: -1.52,
    }).success,
    false,
  );
  assert.equal(
    placeExperienceResponseInputSchema.safeParse({ perception: "UNSAFE" }).success,
    true,
  );
  assert.equal(
    placeExperienceResponseInputSchema.safeParse({ perception: "GUARANTEED_SAFE" }).success,
    false,
  );
  assert.equal(
    placeExperienceResponseInputSchema.safeParse({
      perception: "SAFE",
      reasonCodes: Array.from({ length: 9 }, () => "reason"),
    }).success,
    false,
  );
  assert.equal(
    insertPlaceExperienceCandidateSchema.safeParse({
      userId: "user-1",
      name: "Lieu test",
      category: "shop",
      latitude: 12.37,
      longitude: -1.52,
    }).success,
    true,
  );
  assert.equal(
    insertPlaceExperienceCandidateSchema.safeParse({
      userId: "user-1",
      name: "Lieu test",
      category: "shop",
      latitude: 91,
      longitude: -1.52,
    }).success,
    false,
  );
});

test("la garde d'authentification utilisée par les routes refuse les visiteurs anonymes", async () => {
  const app = express();
  app.use((req, _res, next) => {
    if (req.path === "/api/place-experience/authenticated-test") {
      (req as any).user = { claims: { sub: "user-1" } };
      (req as any).isAuthenticated = () => true;
    }
    next();
  });
  app.get("/api/place-experience/test", requireAuthenticatedUser, (_req, res) => {
    res.json({ ok: true });
  });
  app.get("/api/place-experience/authenticated-test", requireAuthenticatedUser, (_req, res) => {
    res.json({ ok: true });
  });

  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    assert(address && typeof address !== "string");
    const unauthenticated = await fetch(
      `http://127.0.0.1:${address.port}/api/place-experience/test`,
    );
    assert.equal(unauthenticated.status, 401);

    const authenticated = await fetch(
      `http://127.0.0.1:${address.port}/api/place-experience/authenticated-test`,
    );
    assert.equal(authenticated.status, 200);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("les photos de candidats restent privées selon le statut et le rôle", async () => {
  const candidateId = "task-124-candidate-media";
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
  const dataUrl = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  const candidates = new Map(
    ["PENDING", "APPROVED", "REJECTED"].map((status) => [
      status,
      {
        id: candidateId,
        userId: "owner-1",
        mediaUrl: `/api/place-experience/candidates/${candidateId}/media`,
        status,
      } as any,
    ]),
  );
  const app = express();
  app.use((req, _res, next) => {
    const userId = req.headers["x-test-user"];
    const role = req.headers["x-test-role"];
    if (userId || role) {
      (req as any).user = {
        claims: { sub: typeof userId === "string" ? userId : undefined },
        role: typeof role === "string" ? role : undefined,
      };
    }
    next();
  });
  registerPlaceExperienceCandidateMediaRoute(app, {
    getCandidate: async () => candidates.get(app.locals.status) ?? null,
    readMedia: async () => jpeg,
  });
  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const request = async (
    status: string,
    headers: Record<string, string> = {},
  ) => {
    app.locals.status = status;
    return fetch(
      `http://127.0.0.1:${(server.address() as { port: number }).port}/api/place-experience/candidates/${candidateId}/media`,
      { headers },
    );
  };

  try {
    const pendingOwner = await request("PENDING", { "x-test-user": "owner-1" });
    assert.equal(pendingOwner.status, 200);
    assert.equal(pendingOwner.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(Buffer.from(await pendingOwner.arrayBuffer()), jpeg);

    const pendingOther = await request("PENDING", { "x-test-user": "other-1" });
    assert.equal(pendingOther.status, 403);

    const pendingModerator = await request("PENDING", { "x-test-role": "moderator" });
    assert.equal(pendingModerator.status, 200);
    assert.deepEqual(Buffer.from(await pendingModerator.arrayBuffer()), jpeg);

    const approvedAnonymous = await request("APPROVED");
    assert.equal(approvedAnonymous.status, 200);
    assert.equal(approvedAnonymous.headers.get("cache-control"), "public, max-age=3600");
    assert.equal(approvedAnonymous.headers.get("content-type"), "image/jpeg");
    assert.deepEqual(Buffer.from(await approvedAnonymous.arrayBuffer()), jpeg);

    const rejectedOwner = await request("REJECTED", { "x-test-user": "owner-1" });
    assert.equal(rejectedOwner.status, 200);
    assert.equal(rejectedOwner.headers.get("cache-control"), "private, no-store");

    const rejectedModerator = await request("REJECTED", { "x-test-role": "moderateur" });
    assert.equal(rejectedModerator.status, 200);
    assert.deepEqual(Buffer.from(await rejectedModerator.arrayBuffer()), jpeg);

    const rejectedOther = await request("REJECTED", { "x-test-user": "other-1" });
    assert.equal(rejectedOther.status, 403);
  } finally {
    server.close();
    await once(server, "close");
  }

  await writeStreetviewDataUrl(
    `place-experience/candidates/${candidateId}/photo.jpg`,
    dataUrl,
    5 * 1024 * 1024,
  );
  try {
    assert.deepEqual(await readPlaceExperienceCandidateMedia(candidateId), jpeg);
  } finally {
    await deleteStreetviewObject(`place-experience/candidates/${candidateId}/photo.jpg`);
  }
});

test("la politique média refuse les candidats non modérés aux autres utilisateurs", () => {
  for (const status of ["PENDING", "REJECTED"]) {
    assert.equal(
      canReadPlaceExperienceCandidateMedia(
        { status, userId: "owner-1" },
        { claims: { sub: "other-1" } },
      ),
      false,
    );
  }
  assert.equal(
    canReadPlaceExperienceCandidateMedia(
      { status: "APPROVED", userId: "owner-1" },
      undefined,
    ),
    true,
  );
});