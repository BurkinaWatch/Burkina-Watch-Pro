import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { CameraAgentClient } from "../../agent/cameraAgent";

describe("Camera Agent client", () => {
  test("requires HTTPS for production control traffic", () => {
    assert.throws(
      () =>
        new CameraAgentClient({
          controlUrl: "http://camera-control.example",
          production: true,
        }),
      /HTTPS/,
    );
  });

  test("enrolls once and sends a dedicated bearer credential", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const client = new CameraAgentClient({
      controlUrl: "http://localhost:5000",
      fetchImpl: async (input, init) => {
        calls.push({ url: String(input), init });
        if (String(input).endsWith("/enroll")) {
          return new Response(
            JSON.stringify({ agentId: "agent-1", credential: "agent-secret" }),
            { status: 201 },
          );
        }
        return new Response(JSON.stringify({ status: "online" }), { status: 200 });
      },
    });

    await client.enroll({
      agentId: "agent-1",
      enrollmentCode: "one-time-code",
      version: "0.1.0",
    });
    await client.heartbeat({ agentId: "agent-1", version: "0.1.0" });

    const heartbeat = calls[1];
    assert.match(heartbeat.url, /\/heartbeat$/);
    assert.equal(
      (heartbeat.init?.headers as Record<string, string>).Authorization,
      "Bearer agent-secret",
    );
    assert.equal(JSON.stringify(heartbeat.init?.body).includes("agent-secret"), false);
  });

  test("never accepts non-local HTTP development control URLs", () => {
    assert.throws(
      () =>
        new CameraAgentClient({
          controlUrl: "http://192.168.1.20:5000",
        }),
      /localhost/,
    );
  });

  test("requests a scoped media session with the control credential", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const client = new CameraAgentClient({
      controlUrl: "http://localhost:5000",
      fetchImpl: async (input, init) => {
        calls.push({ url: String(input), init });
        if (String(input).endsWith("/enroll")) {
          return new Response(
            JSON.stringify({ agentId: "agent-1", credential: "control-secret" }),
            { status: 201 },
          );
        }
        if (String(input).endsWith("/media-sessions")) {
          return new Response(
            JSON.stringify({
              sessionId: "session-1",
              agentId: "agent-1",
              cameraId: "camera-1",
              streamId: "live",
              pathName: "surveillance-opaque",
              publishUsername: "agent-1",
              publishCredential: "media-secret",
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            }),
            { status: 201 },
          );
        }
        return new Response(JSON.stringify({ status: "online" }), { status: 200 });
      },
    });

    await client.enroll({ agentId: "agent-1", enrollmentCode: "one-time-code" });
    const session = await client.createMediaSession({
      agentId: "agent-1",
      cameraId: "camera-1",
      streamId: "live",
    });

    assert.equal(session.publishCredential, "media-secret");
    const request = calls.at(-1);
    assert.equal(
      (request?.init?.headers as Record<string, string>).Authorization,
      "Bearer control-secret",
    );
    assert.equal(String(request?.init?.body).includes("control-secret"), false);
  });
});