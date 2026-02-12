import * as crypto from "crypto";
import { KeyManagementServiceClient } from "@google-cloud/kms";

// Configuration
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

interface EncryptedData {
  cipherText: string;
  encryptedKey: string;
  iv: string;
  tag: string;
  algorithm: string;
}

interface KMSConfig {
  enabled: boolean;
  projectId?: string;
  locationId?: string;
  keyRingId?: string;
  cryptoKeyId?: string;
}

class EncryptionService {
  private masterKey: Buffer | null = null;
  private kmsClient: KeyManagementServiceClient | null = null;
  private kmsConfig: KMSConfig;

  constructor() {
    this.kmsConfig = {
      enabled: process.env.KMS_ENABLED === "true",
      projectId: process.env.KMS_PROJECT_ID,
      locationId: process.env.KMS_LOCATION_ID || "global",
      keyRingId: process.env.KMS_KEY_RING_ID,
      cryptoKeyId: process.env.KMS_CRYPTO_KEY_ID,
    };

    this.initialize();
  }

  private initialize() {
    if (this.kmsConfig.enabled) {
      try {
        this.kmsClient = new KeyManagementServiceClient();
        console.log("✅ KMS client initialisé");
      } catch (error) {
        console.warn(
          "⚠️  KMS non disponible, utilisation du fallback local:",
          error
        );
        this.initializeFallback();
      }
    } else {
      this.initializeFallback();
    }
  }

  private initializeFallback() {
    const masterKeyHex = process.env.MASTER_ENCRYPTION_KEY;

    if (!masterKeyHex) {
      throw new Error(
        "❌ SÉCURITÉ CRITIQUE: MASTER_ENCRYPTION_KEY non définie. " +
        "Générez une clé sécurisée: openssl rand -hex 32 puis configurez-la dans .env. " +
        "L'application refuse de démarrer sans clé de chiffrement."
      );
    }

    if (masterKeyHex.length !== 64) {
      throw new Error(
        "❌ SÉCURITÉ CRITIQUE: MASTER_ENCRYPTION_KEY invalide. " +
        "La clé doit être 32 bytes en hexadécimal (64 caractères)."
      );
    }

    this.masterKey = Buffer.from(masterKeyHex, "hex");
    console.log("✅ Master key chargée depuis environnement (fallback local)");
  }

  async generateDataKey(): Promise<Buffer> {
    return crypto.randomBytes(KEY_LENGTH);
  }

  async encryptDataKey(dataKey: Buffer): Promise<string> {
    if (this.kmsClient && this.kmsConfig.enabled) {
      return await this.encryptWithKMS(dataKey);
    } else {
      return this.encryptWithMasterKey(dataKey);
    }
  }

  private async encryptWithKMS(dataKey: Buffer): Promise<string> {
    if (!this.kmsClient || !this.kmsConfig.projectId) {
      throw new Error("KMS non configuré correctement");
    }

    const keyName = this.kmsClient.cryptoKeyPath(
      this.kmsConfig.projectId,
      this.kmsConfig.locationId!,
      this.kmsConfig.keyRingId!,
      this.kmsConfig.cryptoKeyId!
    );

    const [encryptResponse] = await this.kmsClient.encrypt({
      name: keyName,
      plaintext: dataKey,
    });

    if (!encryptResponse.ciphertext) {
      throw new Error("KMS encryption failed");
    }

    return Buffer.from(encryptResponse.ciphertext as Uint8Array).toString(
      "base64"
    );
  }

  private encryptWithMasterKey(dataKey: Buffer): string {
    if (!this.masterKey) {
      throw new Error("Master key non disponible");
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(dataKey),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Format: [IV_LENGTH bytes | TAG_LENGTH bytes | encrypted data]
    // Cette structure permet le déchiffrement en extrayant IV et tag
    const combined = Buffer.concat([iv, tag, encrypted]);
    return combined.toString("base64");
  }

  async decryptDataKey(encryptedKey: string): Promise<Buffer> {
    if (this.kmsClient && this.kmsConfig.enabled) {
      return await this.decryptWithKMS(encryptedKey);
    } else {
      return this.decryptWithMasterKey(encryptedKey);
    }
  }

  private async decryptWithKMS(encryptedKey: string): Promise<Buffer> {
    if (!this.kmsClient || !this.kmsConfig.projectId) {
      throw new Error("KMS non configuré correctement");
    }

    const keyName = this.kmsClient.cryptoKeyPath(
      this.kmsConfig.projectId,
      this.kmsConfig.locationId!,
      this.kmsConfig.keyRingId!,
      this.kmsConfig.cryptoKeyId!
    );

    const [decryptResponse] = await this.kmsClient.decrypt({
      name: keyName,
      ciphertext: Buffer.from(encryptedKey, "base64"),
    });

    if (!decryptResponse.plaintext) {
      throw new Error("KMS decryption failed");
    }

    return Buffer.from(decryptResponse.plaintext as Uint8Array);
  }

  private decryptWithMasterKey(encryptedKey: string): Buffer {
    if (!this.masterKey) {
      throw new Error("Master key non disponible");
    }

    // Décode la structure [IV | TAG | encrypted]
    const combined = Buffer.from(encryptedKey, "base64");

    // Vérifier la longueur minimale
    if (combined.length < IV_LENGTH + TAG_LENGTH) {
      throw new Error(
        "Données chiffrées invalides : longueur insuffisante"
      );
    }

    // Extraire IV (16 bytes), tag (16 bytes), et encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

    // Déchiffrer avec AES-256-GCM
    const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
    decipher.setAuthTag(tag);

    try {
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted;
    } catch (error) {
      throw new Error(
        "Échec du déchiffrement : clé incorrecte ou données corrompues"
      );
    }
  }

  async encryptField(plainText: string): Promise<EncryptedData> {
    if (!plainText) {
      throw new Error("Le texte à chiffrer ne peut pas être vide");
    }

    // Générer une clé de données unique pour ce champ
    const dataKey = await this.generateDataKey();

    // Chiffrer les données avec la clé de données
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, dataKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Chiffrer la clé de données avec la master key (ou KMS)
    const encryptedKey = await this.encryptDataKey(dataKey);

    return {
      cipherText: encrypted.toString("base64"),
      encryptedKey,
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      algorithm: ALGORITHM,
    };
  }

  async decryptField(encryptedData: EncryptedData): Promise<string> {
    if (
      !encryptedData.cipherText ||
      !encryptedData.encryptedKey ||
      !encryptedData.iv ||
      !encryptedData.tag
    ) {
      throw new Error("Données chiffrées incomplètes");
    }

    // Déchiffrer la clé de données
    const dataKey = await this.decryptDataKey(encryptedData.encryptedKey);

    // Déchiffrer les données
    const iv = Buffer.from(encryptedData.iv, "base64");
    const tag = Buffer.from(encryptedData.tag, "base64");
    const encrypted = Buffer.from(encryptedData.cipherText, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, dataKey, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  }

  async encryptMultipleFields(
    fields: Record<string, string>
  ): Promise<Record<string, EncryptedData>> {
    const encrypted: Record<string, EncryptedData> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        encrypted[key] = await this.encryptField(value);
      }
    }

    return encrypted;
  }

  async decryptMultipleFields(
    encryptedFields: Record<string, EncryptedData>
  ): Promise<Record<string, string>> {
    const decrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(encryptedFields)) {
      if (value) {
        decrypted[key] = await this.decryptField(value);
      }
    }

    return decrypted;
  }

  generateHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  async rotateKey(oldEncryptedData: EncryptedData): Promise<EncryptedData> {
    // Déchiffrer avec l'ancienne clé
    const plainText = await this.decryptField(oldEncryptedData);

    // Re-chiffrer avec une nouvelle clé
    return await this.encryptField(plainText);
  }
}

export const encryptionService = new EncryptionService();

// Helper functions pour faciliter l'utilisation
export async function encryptSensitiveData(
  data: string
): Promise<EncryptedData> {
  return encryptionService.encryptField(data);
}

export async function decryptSensitiveData(
  encryptedData: EncryptedData
): Promise<string> {
  return encryptionService.decryptField(encryptedData);
}

export function hashSensitiveData(data: string): string {
  return encryptionService.generateHash(data);
}

// Hash refresh tokens avec salt pour stockage sécurisé
export function hashRefreshToken(token: string): string {
  const salt = process.env.REFRESH_TOKEN_SALT || (() => {
    if (process.env.NODE_ENV === "production") throw new Error("REFRESH_TOKEN_SALT must be set in production");
    return "dev-salt-only";
  })();
  return crypto
    .createHash("sha256")
    .update(token + salt)
    .digest("hex");
}

// Générer un refresh token sécurisé
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

// Vérifier un refresh token
export function verifyRefreshTokenHash(token: string, hash: string): boolean {
  return hashRefreshToken(token) === hash;
}
