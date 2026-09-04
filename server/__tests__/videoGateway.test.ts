import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assertVideoStreamAuthorization,
  createVideoGateway,
  DisabledVideoGateway,
  getViewerAccessGrant,
  issueViewerAccess,
  readVideoGatewayConfig,
  revokeViewerAccess,
  validateViewerAccess,
  VIDEO_GATEWAY_STREAM_TTL_SECONDS,
  VideoGatewayAuthorizationError,
  VideoGatewayConfigurationError,
  VideoGatewayUnavailableError,
} from "../videoGateway";

const validRequest = {
  authenticatedUserId: "user-a",
  cameraId: "camera-a",
  cameraOwnerUserId: "user-a",
  cameraStatus: "unknown" as const,
  tokenClaims: {
    userId: "user-a",
    cameraId: "camera-a",
    scope: "surveillance:stream" as const,
    iat: 1_000,
    exp: 1_290,
    jti: "session-a",
  },
  nowSeconds: 1_100,
};

describe("Phase 4 video gateway contract", () => {
  test("keeps the gateway disabled by default", () => {
    const config = readVideoGatewayConfig({});
    assert.deepEqual(config, {
      enabled: false,
      provider: "disabled",
      apiUrl: null,
      publicOrigin: null,
      apiToken: null,
      testMode: false,
      realCameraEnabled: false,
      allowPrivateCameraNetwork: false,
      pathSecret: null,
    });
    assert.equal(createVideoGateway(config) instanceof DisabledVideoGateway, true);
  });

  test("rejects an active gateway without a safe HTTPS origin", () => {
    assert.throws(
      () =>
        readVideoGatewayConfig({
          VIDEO_GATEWAY_ENABLED: "true",
          VIDEO_GATEWAY_PROVIDER: "mediamtx",
          VIDEO_GATEWAY_API_URL: "http://gateway.example.test",
          VIDEO_GATEWAY_PUBLIC_ORIGIN: "https://gateway.example.test",
        }),
      VideoGatewayConfigurationError,
    );
    assert.throws(
      () =>
        readVideoGatewayConfig({
          VIDEO_GATEWAY_ENABLED: "true",
          VIDEO_GATEWAY_PROVIDER: "mediamtx",
          VIDEO_GATEWAY_API_URL: "http://gateway.example.test",
          VIDEO_GATEWAY_PUBLIC_ORIGIN: "http://gateway.example.test",
        }),
      VideoGatewayConfigurationError,
    );
    assert.throws(
      () =>
        readVideoGatewayConfig({
          VIDEO_GATEWAY_ENABLED: "true",
          VIDEO_GATEWAY_PROVIDER: "mediamtx",
          VIDEO_GATEWAY_API_URL: "https://user:password@gateway.example.test",
          VIDEO_GATEWAY_PUBLIC_ORIGIN: "https://gateway.example.test",
        }),
      VideoGatewayConfigurationError,
    );
  });

  test("validates ownership, camera state, and token scope before gateway access", () => {
    assert.doesNotThrow(() => assertVideoStreamAuthorization(validRequest));

    assert.throws(
      () =>
        assertVideoStreamAuthorization({
          ...validRequest,
          cameraOwnerUserId: "user-b",
        }),
      VideoGatewayAuthorizationError,
    );
    assert.throws(
      () =>
        assertVideoStreamAuthorization({
          ...validRequest,
          cameraStatus: "disabled",
        }),
      VideoGatewayAuthorizationError,
    );
    assert.throws(
      () =>
        assertVideoStreamAuthorization({
          ...validRequest,
          cameraId: "camera-b",
        }),
      VideoGatewayAuthorizationError,
    );
  });

  test("returns a controlled error while no media connection exists", async () => {
    await assert.rejects(
      () => new DisabledVideoGateway().authorizeStream(validRequest),
      VideoGatewayUnavailableError,
    );
  });

  test("issues scoped, expiring viewer grants and supports revocation", () => {
    const grant = issueViewerAccess({
      userId: "user-a",
      cameraId: "camera-a",
      pathName: "phase5-path-a",
      nowSeconds: 2_000,
    });
    assert.equal(grant.expiresAt, 2_000 + VIDEO_GATEWAY_STREAM_TTL_SECONDS);
    assert.equal(validateViewerAccess(grant.token, "phase5-path-a", 2_001)?.userId, "user-a");
    assert.equal(validateViewerAccess(grant.token, "phase5-path-b", 2_001), null);
    assert.equal(getViewerAccessGrant(grant.sessionId)?.cameraId, "camera-a");
    assert.equal(revokeViewerAccess(grant.sessionId), true);
    assert.equal(validateViewerAccess(grant.token, "phase5-path-a", 2_001), null);
    assert.equal(getViewerAccessGrant(grant.sessionId), null);
  });

  test("removes expired grants before they can be used", () => {
    const grant = issueViewerAccess({
      userId: "user-expired",
      cameraId: "camera-expired",
      pathName: "phase5-expired",
      nowSeconds: 3_000,
    });
    assert.equal(validateViewerAccess(grant.token, "phase5-expired", grant.expiresAt), null);
    assert.equal(getViewerAccessGrant(grant.sessionId), null);
  });
});