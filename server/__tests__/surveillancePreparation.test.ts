import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assertTemporarySurveillanceVideoToken,
  isSurveillanceVideoTokenScopedTo,
  ownsSurveillanceCamera,
  redactSurveillanceLogData,
  SURVEILLANCE_NO_STORE_HEADERS,
  toSurveillanceCameraDto,
  validateSurveillanceEndpoint,
  type StoredSurveillanceCamera,
} from "../surveillancePreparation";

describe("Surveillance Phase 2 preparation", () => {
  test("never exposes camera credentials in the public DTO", () => {
    const camera: StoredSurveillanceCamera = {
      id: "camera-a",
      ownerUserId: "user-a",
      name: "Atelier",
      description: "Entrée",
      protocol: "rtsp",
      host: "camera.example.test",
      port: 554,
      streamPath: "/live/main",
      credentials: {
        cipherText: "encrypted-password",
        encryptedKey: "encrypted-key",
        iv: "iv",
        tag: "tag",
        algorithm: "aes-256-gcm",
        keyVersion: 1,
      },
      status: "unknown",
      lastSeenAt: null,
      createdAt: new Date("2026-09-04T00:00:00.000Z"),
      updatedAt: new Date("2026-09-04T00:00:00.000Z"),
    };

    const dto = toSurveillanceCameraDto(camera);
    assert.deepEqual(dto, {
      id: "camera-a",
      name: "Atelier",
      description: "Entrée",
      protocol: "rtsp",
      host: "camera.example.test",
      port: 554,
      streamPath: "/live/main",
      status: "pending",
      lastSeenAt: null,
      createdAt: "2026-09-04T00:00:00.000Z",
      updatedAt: "2026-09-04T00:00:00.000Z",
    });
    assert.equal("credentials" in dto, false);
    assert.equal(JSON.stringify(dto).includes("encrypted-password"), false);
  });

  test("keeps camera ownership isolated between users", () => {
    assert.equal(ownsSurveillanceCamera("user-a", "user-a"), true);
    assert.equal(ownsSurveillanceCamera("user-a", "user-b"), false);
    assert.equal(ownsSurveillanceCamera("user-b", "user-a"), false);
    assert.equal(ownsSurveillanceCamera("", "user-a"), false);
  });

  test("rejects unsupported protocols and invalid ports", () => {
    assert.doesNotThrow(() =>
      validateSurveillanceEndpoint({
        protocol: "rtsp",
        host: "192.0.2.10",
        port: 554,
        streamPath: "/live",
      }),
    );
    assert.doesNotThrow(() =>
      validateSurveillanceEndpoint({
        protocol: "onvif",
        host: "camera.example.test",
        port: "8899",
      }),
    );
    assert.throws(
      () =>
        validateSurveillanceEndpoint({
          protocol: "http",
          host: "camera.example.test",
          port: 80,
        }),
      /Protocole caméra/,
    );
    for (const port of [0, 65536, 554.5, "not-a-port"]) {
      assert.throws(
        () =>
          validateSurveillanceEndpoint({
            protocol: "rtsp",
            host: "camera.example.test",
            port,
          }),
        /Port caméra/,
      );
    }
    assert.throws(
      () =>
        validateSurveillanceEndpoint({
          protocol: "rtsp",
          host: "user:password@camera.example.test",
          port: 554,
        }),
      /Hôte caméra/,
    );
  });

  test("requires short-lived, camera-scoped video tokens", () => {
    const now = 1_000;
    const valid = {
      userId: "user-a",
      cameraId: "camera-a",
      scope: "surveillance:stream" as const,
      iat: now - 10,
      exp: now + 290,
      jti: "token-a",
    };

    assert.doesNotThrow(() => assertTemporarySurveillanceVideoToken(valid, now));
    assert.equal(
      isSurveillanceVideoTokenScopedTo(valid, "user-a", "camera-a", now),
      true,
    );
    assert.equal(
      isSurveillanceVideoTokenScopedTo(valid, "user-a", "camera-b", now),
      false,
    );
    assert.equal(
      isSurveillanceVideoTokenScopedTo(valid, "user-b", "camera-a", now),
      false,
    );
    assert.throws(
      () =>
        assertTemporarySurveillanceVideoToken(
          { ...valid, exp: now - 1 },
          now,
        ),
      /expiré/,
    );
    assert.throws(
      () =>
        assertTemporarySurveillanceVideoToken(
          { ...valid, exp: now + 301 },
          now,
        ),
      /temporaire/,
    );
    assert.throws(
      () =>
        assertTemporarySurveillanceVideoToken(
          { ...valid, exp: undefined },
          now,
        ),
      /mal formé/,
    );
  });

  test("redacts RTSP credentials and video tokens before logging", () => {
    const redacted = redactSurveillanceLogData({
      endpoint: "rtsp://camera-user:camera-password@example.test/live",
      token: "permanent-token",
      query: "https://gateway.example.test/whep?access_token=temporary-token",
    }) as Record<string, unknown>;

    assert.equal(redacted.endpoint, "rtsp://[REDACTED]@example.test/live");
    assert.equal(redacted.token, "[REDACTED]");
    assert.equal(
      redacted.query,
      "https://gateway.example.test/whep?access_token=[REDACTED]",
    );
    assert.equal(JSON.stringify(redacted).includes("camera-password"), false);
    assert.equal(JSON.stringify(redacted).includes("temporary-token"), false);
  });

  test("declares surveillance responses non-cacheable", () => {
    assert.equal(SURVEILLANCE_NO_STORE_HEADERS["Cache-Control"], "no-store, private");
    assert.equal(SURVEILLANCE_NO_STORE_HEADERS.Pragma, "no-cache");
  });
});