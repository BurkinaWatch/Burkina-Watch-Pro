import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  CAMERA_AGENT_OFFLINE_AFTER_SECONDS,
  CAMERA_AGENT_STALE_AFTER_SECONDS,
  generateAgentSecret,
  getAgentStatus,
  getReconnectDelayMs,
  hashAgentSecret,
  verifyAgentSecret,
} from "../agentProtocol";

describe("secure Camera Agent protocol", () => {
  test("generates credentials that are not stored as plaintext", () => {
    const secret = generateAgentSecret();
    const hash = hashAgentSecret(secret);

    assert.ok(secret.length >= 40);
    assert.notEqual(secret, hash);
    assert.equal(verifyAgentSecret(secret, hash), true);
    assert.equal(verifyAgentSecret(`${secret}-wrong`, hash), false);
  });

  test("classifies heartbeat freshness without confusing stale and offline", () => {
    const now = Date.parse("2026-09-04T12:00:00.000Z");
    const recent = new Date(now - (CAMERA_AGENT_STALE_AFTER_SECONDS - 1) * 1000);
    const stale = new Date(now - (CAMERA_AGENT_STALE_AFTER_SECONDS + 1) * 1000);
    const offline = new Date(now - (CAMERA_AGENT_OFFLINE_AFTER_SECONDS + 1) * 1000);

    assert.equal(getAgentStatus(recent, now), "online");
    assert.equal(getAgentStatus(stale, now), "stale");
    assert.equal(getAgentStatus(offline, now), "offline");
    assert.equal(getAgentStatus(null, now), "enrolled");
  });

  test("caps reconnect backoff and increases it progressively", () => {
    assert.equal(getReconnectDelayMs(0), 1_000);
    assert.equal(getReconnectDelayMs(1), 2_000);
    assert.equal(getReconnectDelayMs(6), 60_000);
    assert.equal(getReconnectDelayMs(99), 60_000);
  });
});