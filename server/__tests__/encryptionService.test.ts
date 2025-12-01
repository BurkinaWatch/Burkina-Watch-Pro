// IMPORTANT: Définir la clé de chiffrement AVANT d'importer le module
// car l'encryptionService est un singleton initialisé à l'import
process.env.MASTER_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.REFRESH_TOKEN_SALT =
  "test_salt_0123456789abcdef0123456789abcdef0123456789abcdef";

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  encryptionService,
  encryptSensitiveData,
  decryptSensitiveData,
  hashRefreshToken,
  generateRefreshToken,
  verifyRefreshTokenHash,
} from "../encryptionService";

describe("EncryptionService", () => {
  describe("Field Encryption/Decryption (Round-trip)", () => {
    test("should successfully encrypt and decrypt a string", async () => {
      const originalText = "Données sensibles - test encryption";

      const encrypted = await encryptSensitiveData(originalText);

      assert.ok(encrypted.cipherText, "cipherText devrait exister");
      assert.ok(encrypted.encryptedKey, "encryptedKey devrait exister");
      assert.ok(encrypted.iv, "iv devrait exister");
      assert.ok(encrypted.tag, "tag devrait exister");
      assert.equal(encrypted.algorithm, "aes-256-gcm");

      const decrypted = await decryptSensitiveData(encrypted);

      assert.equal(decrypted, originalText);
    });

    test("should encrypt email addresses correctly", async () => {
      const email = "test@burkinawatch.com";

      const encrypted = await encryptSensitiveData(email);
      const decrypted = await decryptSensitiveData(encrypted);

      assert.equal(decrypted, email);
    });

    test("should encrypt phone numbers correctly", async () => {
      const phone = "+226 65511323";

      const encrypted = await encryptSensitiveData(phone);
      const decrypted = await decryptSensitiveData(encrypted);

      assert.equal(decrypted, phone);
    });

    test("should handle special characters in encryption", async () => {
      const specialText = "Éléphant 🐘 ñoño @#$%^&*()";

      const encrypted = await encryptSensitiveData(specialText);
      const decrypted = await decryptSensitiveData(encrypted);

      assert.equal(decrypted, specialText);
    });

    test("should generate different ciphertexts for same plaintext", async () => {
      const plaintext = "Same text";

      const encrypted1 = await encryptSensitiveData(plaintext);
      const encrypted2 = await encryptSensitiveData(plaintext);

      // IVs différents = ciphertexts différents
      assert.notEqual(encrypted1.iv, encrypted2.iv);
      assert.notEqual(encrypted1.cipherText, encrypted2.cipherText);

      // Mais le déchiffrement doit retourner le même texte
      const decrypted1 = await decryptSensitiveData(encrypted1);
      const decrypted2 = await decryptSensitiveData(encrypted2);

      assert.equal(decrypted1, plaintext);
      assert.equal(decrypted2, plaintext);
    });
  });

  describe("Multiple Fields Encryption", () => {
    test("should encrypt multiple fields at once", async () => {
      const fields = {
        email: "user@example.com",
        phone: "+226 70019540",
        address: "Ouagadougou, Burkina Faso",
      };

      const encrypted = await encryptionService.encryptMultipleFields(fields);

      assert.ok(encrypted.email.cipherText);
      assert.ok(encrypted.phone.cipherText);
      assert.ok(encrypted.address.cipherText);

      const decrypted = await encryptionService.decryptMultipleFields(
        encrypted
      );

      assert.equal(decrypted.email, fields.email);
      assert.equal(decrypted.phone, fields.phone);
      assert.equal(decrypted.address, fields.address);
    });
  });

  describe("Error Handling", () => {
    test("should throw error when encrypting empty string", async () => {
      await assert.rejects(
        async () => await encryptSensitiveData(""),
        {
          message: "Le texte à chiffrer ne peut pas être vide",
        }
      );
    });

    test("should throw error when decrypting invalid data", async () => {
      const invalidEncrypted = {
        cipherText: "invalid",
        encryptedKey: "invalid",
        iv: "invalid",
        tag: "invalid",
        algorithm: "aes-256-gcm" as const,
      };

      await assert.rejects(async () =>
        await decryptSensitiveData(invalidEncrypted)
      );
    });

    test("should throw error when decrypting with wrong key", async () => {
      const originalText = "Secret data";
      const encrypted = await encryptSensitiveData(originalText);

      // Modifier la clé pour simuler une clé incorrecte
      const corruptedEncrypted = {
        ...encrypted,
        encryptedKey: encrypted.encryptedKey.replace(/./g, "X"),
      };

      await assert.rejects(async () =>
        await decryptSensitiveData(corruptedEncrypted)
      );
    });
  });

  describe("Refresh Token Hashing", () => {
    test("should generate a valid refresh token", () => {
      const token = generateRefreshToken();

      assert.ok(token);
      assert.equal(token.length, 128); // 64 bytes = 128 hex chars
      assert.ok(/^[0-9a-f]+$/.test(token));
    });

    test("should hash refresh token consistently", () => {
      const token = "test-refresh-token-12345";

      const hash1 = hashRefreshToken(token);
      const hash2 = hashRefreshToken(token);

      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64); // SHA-256 = 64 hex chars
    });

    test("should verify refresh token hash correctly", () => {
      const token = generateRefreshToken();
      const hash = hashRefreshToken(token);

      assert.equal(verifyRefreshTokenHash(token, hash), true);
    });

    test("should fail verification with wrong token", () => {
      const token = generateRefreshToken();
      const hash = hashRefreshToken(token);
      const wrongToken = generateRefreshToken();

      assert.equal(verifyRefreshTokenHash(wrongToken, hash), false);
    });

    test("should produce different hashes for different tokens", () => {
      const token1 = "token-1";
      const token2 = "token-2";

      const hash1 = hashRefreshToken(token1);
      const hash2 = hashRefreshToken(token2);

      assert.notEqual(hash1, hash2);
    });
  });

  describe("Key Rotation", () => {
    test("should rotate encryption for existing data", async () => {
      const originalText = "Data to rotate";

      const encrypted1 = await encryptSensitiveData(originalText);
      const rotated = await encryptionService.rotateKey(encrypted1);

      // Nouvelles clés générées
      assert.notEqual(rotated.encryptedKey, encrypted1.encryptedKey);
      assert.notEqual(rotated.iv, encrypted1.iv);

      // Mais le texte déchiffré est identique
      const decrypted = await decryptSensitiveData(rotated);
      assert.equal(decrypted, originalText);
    });
  });

  describe("Hash Function", () => {
    test("should generate consistent SHA-256 hash", () => {
      const data = "test data";

      const hash1 = encryptionService.generateHash(data);
      const hash2 = encryptionService.generateHash(data);

      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64); // SHA-256 = 64 hex chars
    });

    test("should generate different hashes for different data", () => {
      const hash1 = encryptionService.generateHash("data1");
      const hash2 = encryptionService.generateHash("data2");

      assert.notEqual(hash1, hash2);
    });
  });

  describe("Performance", () => {
    test(
      "should encrypt/decrypt 100 fields in reasonable time",
      async () => {
        const start = Date.now();

        const promises = [];
        for (let i = 0; i < 100; i++) {
          promises.push(encryptSensitiveData(`Test data ${i}`));
        }

        const encrypted = await Promise.all(promises);
        const decryptPromises = encrypted.map((e) => decryptSensitiveData(e));
        await Promise.all(decryptPromises);

        const duration = Date.now() - start;

        // Devrait prendre moins de 5 secondes pour 100 opérations round-trip
        assert.ok(
          duration < 5000,
          `Performance test failed: ${duration}ms >= 5000ms`
        );
      },
      { timeout: 10000 }
    ); // timeout de 10s
  });
});
