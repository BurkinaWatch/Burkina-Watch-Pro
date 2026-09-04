import crypto from "node:crypto";

export const CAMERA_AGENT_ENROLLMENT_TTL_SECONDS = 10 * 60;
export const CAMERA_AGENT_HEARTBEAT_INTERVAL_SECONDS = 30;
export const CAMERA_AGENT_STALE_AFTER_SECONDS = 90;
export const CAMERA_AGENT_OFFLINE_AFTER_SECONDS = 5 * 60;

export const CAMERA_AGENT_STATUSES = [
  "pending",
  "enrolled",
  "online",
  "stale",
  "offline",
  "revoked",
  "error",
] as const;
export type CameraAgentStatus = (typeof CAMERA_AGENT_STATUSES)[number];

export function generateAgentSecret(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashAgentSecret(secret: string): string {
  return crypto.createHash("sha256").update(secret, "utf8").digest("hex");
}

export function verifyAgentSecret(secret: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashAgentSecret(secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function getAgentStatus(
  lastSeenAt: Date | null | undefined,
  now = Date.now(),
): CameraAgentStatus {
  if (!lastSeenAt) return "enrolled";
  const ageSeconds = Math.max(0, (now - lastSeenAt.getTime()) / 1000);
  if (ageSeconds <= CAMERA_AGENT_STALE_AFTER_SECONDS) return "online";
  if (ageSeconds <= CAMERA_AGENT_OFFLINE_AFTER_SECONDS) return "stale";
  return "offline";
}

export function getReconnectDelayMs(attempt: number): number {
  const boundedAttempt = Math.max(0, Math.min(Math.floor(attempt), 6));
  return Math.min(60_000, 1_000 * 2 ** boundedAttempt);
}