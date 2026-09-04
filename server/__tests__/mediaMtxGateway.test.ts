import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { MediaMtxVideoGateway } from "../mediaMtxGateway";
import { SURVEILLANCE_TEST_SOURCE_URL } from "../surveillancePrototype";

const config = {
  enabled: true as const,
  provider: "mediamtx" as const,
  apiUrl: "http://127.0.0.1:9997",
  publicOrigin: "http://127.0.0.1:8889",
  apiToken: null,
  testMode: true,
  realCameraEnabled: false,
  allowPrivateCameraNetwork: false,
  pathSecret: null,
};

function authorizedRequest() {
  const nowSeconds = 10_000;
  return {
    authenticatedUserId: "user-a",
    cameraId: "camera-a",
    cameraOwnerUserId: "user-a",
    cameraStatus: "unknown" as const,
    tokenClaims: {
      userId: "user-a",
      cameraId: "camera-a",
      scope: "surveillance:stream" as const,
      iat: nowSeconds - 10,
      exp: nowSeconds + 50,
      jti: "authorization-a",
    },
    nowSeconds,
  };
}

describe("MediaMTX video gateway adapter", () => {
  test("registers, checks, and removes a controlled local RTSP path", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const gateway = new MediaMtxVideoGateway({
      config,
      fetchImpl: async (input, init) => {
        calls.push({ url: String(input), init });
        if (String(input).includes("/v3/paths/get/")) {
          return new Response(JSON.stringify({ ready: true }), { status: 200 });
        }
        return new Response(null, { status: 204 });
      },
    });

    const registered = await gateway.registerStream({
      cameraId: "camera-a",
      sourceUrl: "rtsp://127.0.0.1:8554/custom-camera-path",
    });
    assert.match(registered.pathName, /^phase5-/);
    assert.equal(registered.status, "connecting");
    assert.equal(await gateway.getStreamStatus("camera-a"), "online");
    await gateway.removeStream("camera-a");
    assert.equal(calls.filter((call) => call.init?.method === "DELETE").length, 1);
  });

  test("creates a WHEP access grant without putting a token in the URL", async () => {
    const gateway = new MediaMtxVideoGateway({
      config,
      fetchImpl: async () => new Response(null, { status: 204 }),
    });
    const registered = await gateway.registerStream({
      cameraId: "camera-a",
      sourceUrl: SURVEILLANCE_TEST_SOURCE_URL,
    });
    const access = await gateway.createViewerAccess(authorizedRequest());
    assert.equal(access.pathName, registered.pathName);
    assert.equal(
      access.whepUrl,
      `http://127.0.0.1:8889/${encodeURIComponent(registered.pathName)}/whep`,
    );
    assert.equal(access.whepUrl.includes(access.viewerToken), false);
  });

  test("rejects credentials and non-local sources", async () => {
    const gateway = new MediaMtxVideoGateway({
      config,
      fetchImpl: async () => new Response(null, { status: 204 }),
    });
    await assert.rejects(
      () =>
        gateway.registerStream({
          cameraId: "camera-a",
          sourceUrl: "rtsp://user:password@127.0.0.1:8554/phase5-test",
        }),
      /sans credential/,
    );
    await assert.rejects(
      () =>
        gateway.registerStream({
          cameraId: "camera-b",
          sourceUrl: "rtsp://10.0.0.20:8554/phase5-test",
        }),
      /locale/,
    );
  });

  test("supports multiple viewer grants on one registered path", async () => {
    const gateway = new MediaMtxVideoGateway({
      config,
      fetchImpl: async () => new Response(null, { status: 204 }),
    });
    await gateway.registerStream({
      cameraId: "camera-a",
      sourceUrl: SURVEILLANCE_TEST_SOURCE_URL,
    });
    const first = await gateway.createViewerAccess(authorizedRequest());
    const second = await gateway.createViewerAccess({
      ...authorizedRequest(),
      tokenClaims: {
        ...authorizedRequest().tokenClaims,
        jti: "authorization-b",
      },
    });
    assert.notEqual(first.viewerToken, second.viewerToken);
    assert.notEqual(first.gatewaySessionId, second.gatewaySessionId);
  });
});