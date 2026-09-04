import crypto from "node:crypto";
import { getSessionSecret } from "./securityConfig";

export type StreetviewUploadSession = {
  contributionId: string;
  userId: string;
  storageKey: string;
  uploadId: string;
  size: number;
  mimeType: string;
  partSizeBytes: number;
  expiresAt: number;
};

const SESSION_TTL_SECONDS = 6 * 60 * 60;

function encode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function issueStreetviewUploadSession(session: Omit<StreetviewUploadSession, "expiresAt">): string {
  const payload = encode(JSON.stringify({
    ...session,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  }));
  return `${payload}.${signature(payload)}`;
}

export function verifyStreetviewUploadSession(token: string): StreetviewUploadSession {
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature || !crypto.timingSafeEqual(
    Buffer.from(signature(payload)),
    Buffer.from(providedSignature),
  )) {
    throw new Error("Invalid StreetView upload session");
  }
  const session = JSON.parse(decode(payload)) as StreetviewUploadSession;
  if (!session.expiresAt || session.expiresAt < Math.floor(Date.now() / 1000)) {
    throw new Error("StreetView upload session expired");
  }
  return session;
}