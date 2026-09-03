import crypto from "node:crypto";

const MIN_SESSION_SECRET_LENGTH = 32;
const developmentSessionSecret = crypto.randomBytes(32).toString("hex");
const REQUIRED_KMS_VARIABLES = [
  "KMS_PROJECT_ID",
  "KMS_LOCATION_ID",
  "KMS_KEY_RING_ID",
  "KMS_CRYPTO_KEY_ID",
] as const;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function assertProductionSecurityConfiguration(): void {
  if (!isProduction()) {
    return;
  }

  const sessionSecret = process.env.SESSION_SECRET?.trim();
  if (!sessionSecret || sessionSecret.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error(
      "SESSION_SECRET doit être défini en production et contenir au moins 32 caractères.",
    );
  }

  if (!process.env.REFRESH_TOKEN_SALT?.trim()) {
    throw new Error(
      "REFRESH_TOKEN_SALT doit être défini en production avec une valeur stable.",
    );
  }

  if (process.env.KMS_ENABLED === "true") {
    const missingKmsVariables = REQUIRED_KMS_VARIABLES.filter(
      (name) => !process.env[name]?.trim(),
    );
    if (missingKmsVariables.length > 0) {
      throw new Error(
        "La configuration KMS de production est incomplète.",
      );
    }
  } else if (!process.env.MASTER_ENCRYPTION_KEY?.trim()) {
    throw new Error(
      "MASTER_ENCRYPTION_KEY doit être défini lorsque KMS est désactivé en production.",
    );
  }
}

export function getSessionSecret(): string {
  assertProductionSecurityConfiguration();
  return process.env.SESSION_SECRET?.trim() || developmentSessionSecret;
}

export function getOtpHashSecret(): string {
  return process.env.OTP_HASH_SECRET?.trim() || getSessionSecret();
}