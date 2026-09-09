import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import express from "express";
import { requireAuthenticatedUser } from "./authorization";
import {
  createMobileSessionsHandler,
  type MobileSessionRecord,
} from "./mobileSessions";

test("GET /api/auth/mobile/sessions exposes only public fields for active sessions", async () => {
  const now = new Date();
  const rawUserAgent =
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile";
  const activeSession = {
    id: "active-session",
    createdAt: new Date(now.getTime() - 60_000),
    expiresAt: new Date(now.getTime() + 60 * 60_000),
    userAgent: rawUserAgent,
    token: "refresh-token-that-must-never-leak",
    ipAddress: "198.51.100.42",
  } as MobileSessionRecord & Record<string, unknown>;
  const revokedSession = {
    ...activeSession,
    id: "revoked-session",
    revokedAt: new Date(now.getTime() - 30_000),
    token: "revoked-token-that-must-never-leak",
  } as MobileSessionRecord & Record<string, unknown>;
  const expiredSession = {
    ...activeSession,
    id: "expired-session",
    expiresAt: new Date(now.getTime() - 30_000),
    token: "expired-token-that-must-never-leak",
  } as MobileSessionRecord & Record<string, unknown>;

  let requestedUserId: string | undefined;
  const sessionStore = {
    async getActiveMobileSessions(userId: string) {
      requestedUserId = userId;
      return [activeSession, revokedSession, expiredSession];
    },
  };

  const app = express();
  app.use((req, _res, next) => {
    (req as any).user = { id: "authenticated-user" };
    (req as any).isAuthenticated = () => true;
    next();
  });
  app.get(
    "/api/auth/mobile/sessions",
    requireAuthenticatedUser,
    createMobileSessionsHandler(sessionStore),
  );

  const server = http.createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    assert(address && typeof address !== "string");

    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/auth/mobile/sessions`,
    );
    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      sessions: Array<Record<string, unknown>>;
    };
    assert.equal(requestedUserId, "authenticated-user");
    assert.deepEqual(Object.keys(body), ["sessions"]);
    assert.equal(body.sessions.length, 1);
    assert.deepEqual(Object.keys(body.sessions[0]), [
      "id",
      "createdAt",
      "expiresAt",
      "device",
      "browser",
    ]);
    assert.equal(body.sessions[0].id, "active-session");
    assert.equal(body.sessions[0].device, "Android");
    assert.equal(body.sessions[0].browser, "Chrome");

    const serializedResponse = JSON.stringify(body);
    assert(!serializedResponse.includes("refresh-token-that-must-never-leak"));
    assert(!serializedResponse.includes("revoked-token-that-must-never-leak"));
    assert(!serializedResponse.includes("expired-token-that-must-never-leak"));
    assert(!serializedResponse.includes("198.51.100.42"));
    assert(!serializedResponse.includes(rawUserAgent));
    assert(!serializedResponse.includes("revokedAt"));
    assert(!serializedResponse.includes("token"));
    assert(!serializedResponse.includes("ipAddress"));
    assert(!serializedResponse.includes("userAgent"));
  } finally {
    server.close();
    await once(server, "close");
  }
});