import crypto from "node:crypto";

const MIN_SESSION_SECRET_LENGTH = 32;
const developmentSessionSecret = crypto.randomBytes(32).toString("hex");

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
}

export function getSessionSecret(): string {
  assertProductionSecurityConfiguration();
  return process.env.SESSION_SECRET?.trim() || developmentSessionSecret;
}

export function getOtpHashSecret(): string {
  return process.env.OTP_HASH_SECRET?.trim() || getSessionSecret();
}