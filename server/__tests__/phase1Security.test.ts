import assert from "node:assert/strict";
import { describe, test } from "node:test";

process.env.SESSION_SECRET =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import {
  getAuthenticatedPrincipal,
  requirePermission,
  requireResourceOwnership,
} from "../authorization";
import { generateOtp, hashOtpCode, verifyOtpRecord } from "../otpSecurity";
import {
  assertProductionSecurityConfiguration,
  getSessionSecret,
} from "../securityConfig";
import { redactSensitiveData, redactSensitiveText } from "../securityRedaction";
import { isBlockedIp } from "../ssrfProtection";
import {
  createCsrfToken,
  csrfProtection,
} from "../csrfProtection";

function mockResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.body = body;
      return response;
    },
  };
  return response;
}

describe("Phase 1 security foundations", () => {
  test("accepts a strong production session secret and rejects a missing one", () => {
    const originalEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.SESSION_SECRET = "a".repeat(32);
    assert.doesNotThrow(assertProductionSecurityConfiguration);
    assert.equal(getSessionSecret(), "a".repeat(32));

    delete process.env.SESSION_SECRET;
    assert.throws(assertProductionSecurityConfiguration, /SESSION_SECRET/);

    if (originalEnvironment === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalEnvironment;
    }
    process.env.SESSION_SECRET =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  test("generates six-digit OTPs and verifies only the matching hash", () => {
    const otp = generateOtp();
    assert.match(otp, /^\d{6}$/);
    const identifier = "user@example.com";
    const type = "email";
    const record = {
      code: hashOtpCode(otp, identifier, type),
      expiresAt: new Date(Date.now() + 60_000),
      verified: false,
      attempts: 0,
    };

    assert.equal(verifyOtpRecord(record, otp, identifier, type), "valid");
    assert.equal(
      verifyOtpRecord(record, "000000", identifier, type),
      "invalid",
    );
    assert.equal(
      verifyOtpRecord(
        { ...record, expiresAt: new Date(Date.now() - 1) },
        otp,
        identifier,
        type,
      ),
      "expired",
    );
    assert.equal(
      verifyOtpRecord({ ...record, attempts: 5 }, otp, identifier, type),
      "locked",
    );
    assert.equal(
      verifyOtpRecord({ ...record, verified: true }, otp, identifier, type),
      "expired",
    );
  });

  test("rejects private, loopback, link-local, and multicast addresses", () => {
    for (const ip of [
      "0.0.0.0",
      "10.0.0.1",
      "127.0.0.1",
      "169.254.169.254",
      "172.16.0.1",
      "192.168.1.1",
      "::1",
      "fc00::1",
      "fe80::1",
      "ff02::1",
    ]) {
      assert.equal(isBlockedIp(ip), true, ip);
    }
    assert.equal(isBlockedIp("8.8.8.8"), false);
  });

  test("redacts credentials, tokens, and secret-shaped fields", () => {
    const text = redactSensitiveText(
      "rtsp://camera:password@example.test/live?token=abc123",
    );
    assert.equal(text.includes("password"), false);
    assert.equal(text.includes("abc123"), false);

    const data = redactSensitiveData({
      username: "visible",
      password: "hidden",
      nested: { accessToken: "also-hidden" },
    }) as Record<string, unknown>;
    assert.equal(data.username, "visible");
    assert.equal(data.password, "[REDACTED]");
    assert.deepEqual(data.nested, { accessToken: "[REDACTED]" });
  });

  test("requires authentication and ownership for reusable middleware", async () => {
    const unauthenticatedRequest = {
      user: undefined,
      isAuthenticated: () => false,
    } as any;
    const unauthenticatedResponse = mockResponse();
    await requireResourceOwnership(async () => ({ userId: "owner" }))(
      unauthenticatedRequest,
      unauthenticatedResponse as any,
      () => assert.fail("next should not run"),
    );
    assert.equal(unauthenticatedResponse.statusCode, 401);

    const principalRequest = {
      user: { claims: { sub: "owner" }, role: "user" },
      isAuthenticated: () => true,
    } as any;
    assert.equal(getAuthenticatedPrincipal(principalRequest)?.id, "owner");

    let nextCalled = false;
    await requireResourceOwnership(async () => ({ ownerUserId: "owner" }))(
      principalRequest,
      mockResponse() as any,
      () => {
        nextCalled = true;
      },
    );
    assert.equal(nextCalled, true);

    const forbiddenResponse = mockResponse();
    await requirePermission("camera:view", async () => false)(
      principalRequest,
      forbiddenResponse as any,
      () => assert.fail("next should not run"),
    );
    assert.equal(forbiddenResponse.statusCode, 403);
  });

  test("accepts same-origin CSRF requests and rejects missing or invalid protection", async () => {
    const baseRequest = {
      method: "POST",
      protocol: "https",
      sessionID: "session-a",
      user: { id: "user-a" },
      isAuthenticated: () => true,
      get(name: string) {
        const headers: Record<string, string> = {
          host: "burkina-watch.example",
          origin: "https://burkina-watch.example",
        };
        return headers[name.toLowerCase()];
      },
    } as any;

    let nextCalled = false;
    await csrfProtection(baseRequest, mockResponse() as any, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);

    const missingOriginRequest = {
      ...baseRequest,
      get(name: string) {
        const headers: Record<string, string> = {
          host: "burkina-watch.example",
        };
        return headers[name.toLowerCase()];
      },
    } as any;
    const missingOriginResponse = mockResponse();
    await csrfProtection(
      missingOriginRequest,
      missingOriginResponse as any,
      () => assert.fail("request without CSRF protection should be rejected"),
    );
    assert.equal(missingOriginResponse.statusCode, 403);

    const tokenRequest = {
      ...missingOriginRequest,
      get(name: string) {
        const token = createCsrfToken(tokenRequest);
        const headers: Record<string, string> = {
          host: "burkina-watch.example",
          cookie: `csrf_token=${encodeURIComponent(token)}`,
          "x-csrf-token": token,
        };
        return headers[name.toLowerCase()];
      },
    } as any;
    const invalidTokenResponse = mockResponse();
    await csrfProtection(
      {
        ...tokenRequest,
        get(name: string) {
          const headers: Record<string, string> = {
            host: "burkina-watch.example",
            cookie: "csrf_token=invalid",
            "x-csrf-token": "invalid",
          };
          return headers[name.toLowerCase()];
        },
      } as any,
      invalidTokenResponse as any,
      () => assert.fail("invalid CSRF token should be rejected"),
    );
    assert.equal(invalidTokenResponse.statusCode, 403);
  });
});