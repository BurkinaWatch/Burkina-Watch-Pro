import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

describe("Prompt 8 media-plane guardrails", () => {
  test("binds the local MediaMTX prototype to loopback only", () => {
    const compose = readFileSync("docker-compose.phase5.yml", "utf8");

    assert.match(compose, /127\.0\.0\.1:8554:8554/);
    assert.match(compose, /127\.0\.0\.1:9997:9997/);
    assert.match(compose, /127\.0\.0\.1:8889:8889/);
    assert.equal(compose.includes('"9997:9997"'), false);
  });

  test("keeps Prompt 8 architecture decisions explicit", () => {
    const architecture = readFileSync(
      "docs/PHASE_8_ARCHITECTURE_PRODUCTION.md",
      "utf8",
    );

    assert.match(architecture, /connexion sortante TLS/i);
    assert.match(architecture, /API admin MediaMTX/i);
    assert.match(architecture, /STUN/i);
    assert.match(architecture, /TURN/i);
    assert.match(architecture, /READY WITH CONDITIONS/);
  });
});