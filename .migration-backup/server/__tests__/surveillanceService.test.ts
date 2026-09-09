import assert from "node:assert/strict";
import { describe, test } from "node:test";

// The encryption singleton is initialized during module import. Keep this
// deterministic test key scoped to the test process and set it before the
// service modules are loaded.
process.env.MASTER_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.KMS_ENABLED = "false";

const { decryptSensitiveData } = await import("../encryptionService");
const {
  encryptCameraPassword,
  parseCreateSurveillanceCamera,
  parseUpdateSurveillanceCamera,
} = await import("../surveillanceService");
const { SurveillanceValidationError } = await import(
  "../surveillancePreparation"
);

describe("Surveillance camera service", () => {
  test("validates create data and never accepts a client-controlled owner", () => {
    const input = parseCreateSurveillanceCamera({
      name: "Caméra de test",
      description: "Données fictives uniquement",
      connectionType: "rtsp",
      host: "camera-test.local",
      port: "554",
      username: "test-user",
      password: "test-only-password",
      streamPath: "/stream1",
    });

    assert.equal(input.port, 554);
    assert.equal(input.connectionType, "rtsp");
    assert.throws(
      () =>
        parseCreateSurveillanceCamera({
          ...input,
          ownerId: "attacker-controlled-owner",
        }),
      SurveillanceValidationError,
    );
    assert.throws(
      () =>
        parseCreateSurveillanceCamera({
          ...input,
          name: " ",
        }),
      /nom de la caméra/,
    );
  });

  test("allows update without replacing an existing password", () => {
    const update = parseUpdateSurveillanceCamera({
      name: "Nom mis à jour",
      password: "",
    });

    assert.equal(update.name, "Nom mis à jour");
    assert.equal(update.password, "");
  });

  test("stores the camera password as an AES-256-GCM envelope", async () => {
    const stored = await encryptCameraPassword("test-only-password");
    assert.equal(stored.includes("test-only-password"), false);

    const decrypted = await decryptSensitiveData(JSON.parse(stored));
    assert.equal(decrypted, "test-only-password");

    await assert.rejects(
      () => encryptCameraPassword(""),
      SurveillanceValidationError,
    );
  });
});