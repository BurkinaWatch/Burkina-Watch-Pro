import crypto from "node:crypto";
import type { OtpCode } from "@shared/schema";
import { getOtpHashSecret } from "./securityConfig";

export const OTP_MAX_ATTEMPTS = 5;
export const OTP_TTL_MS = 5 * 60 * 1000;

export type OtpVerificationResult =
  | "valid"
  | "invalid"
  | "expired"
  | "locked";

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtpCode(
  code: string,
  identifier: string,
  type: string,
): string {
  return crypto
    .createHmac("sha256", getOtpHashSecret())
    .update(`${type}:${identifier}:${code}`, "utf8")
    .digest("hex");
}

function timingSafeEqualText(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function matchesStoredOtp(
  storedCode: string,
  suppliedCode: string,
  identifier: string,
  type: string,
): boolean {
  const hashedCode = hashOtpCode(suppliedCode, identifier, type);
  if (/^[a-f0-9]{64}$/i.test(storedCode)) {
    return timingSafeEqualText(storedCode.toLowerCase(), hashedCode);
  }

  // Compatibilité limitée avec les OTP créés avant cette correction.
  return /^\d{6}$/.test(storedCode) && timingSafeEqualText(storedCode, suppliedCode);
}

export function verifyOtpRecord(
  record: Pick<OtpCode, "code" | "expiresAt" | "verified" | "attempts">,
  suppliedCode: string,
  identifier: string,
  type: string,
  now = Date.now(),
): OtpVerificationResult {
  if (record.verified || record.expiresAt.getTime() <= now) {
    return "expired";
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return "locked";
  }

  if (!/^\d{6}$/.test(suppliedCode)) {
    return "invalid";
  }

  return matchesStoredOtp(record.code, suppliedCode, identifier, type)
    ? "valid"
    : "invalid";
}