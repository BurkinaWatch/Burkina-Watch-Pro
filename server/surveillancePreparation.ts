import { redactSensitiveData } from "./securityRedaction";

/**
 * Preparation-only contracts for the future surveillance control plane.
 *
 * This module deliberately has no database, Express, gateway, or network
 * side-effects. It documents and tests the security boundary before any
 * surveillance route is connected.
 */

export const SURVEILLANCE_PROTOCOLS = ["rtsp", "onvif"] as const;
export type SurveillanceProtocol = (typeof SURVEILLANCE_PROTOCOLS)[number];

export const SURVEILLANCE_CAMERA_STATUSES = [
  "pending",
  "online",
  "offline",
  "disabled",
] as const;
export type SurveillanceCameraStatus =
  (typeof SURVEILLANCE_CAMERA_STATUSES)[number];

export const SURVEILLANCE_VIDEO_SCOPE = "surveillance:stream" as const;
export const MAX_SURVEILLANCE_VIDEO_TOKEN_TTL_SECONDS = 5 * 60;

export interface EncryptedCameraCredentials {
  cipherText: string;
  encryptedKey: string;
  iv: string;
  tag: string;
  algorithm: "aes-256-gcm";
  keyVersion: number;
}

export interface StoredSurveillanceCamera {
  id: string;
  ownerUserId: string;
  name: string;
  description?: string | null;
  protocol: SurveillanceProtocol;
  host: string;
  port: number;
  streamPath?: string | null;
  credentials: EncryptedCameraCredentials;
  status: SurveillanceCameraStatus;
  lastSeenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This is the only camera shape that may cross a future API boundary.
 * Credentials and encryption metadata are intentionally absent.
 */
export interface SurveillanceCameraDto {
  id: string;
  name: string;
  description: string | null;
  protocol: SurveillanceProtocol;
  host: string;
  port: number;
  streamPath: string | null;
  status: SurveillanceCameraStatus;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SurveillanceEndpoint {
  protocol: SurveillanceProtocol;
  host: string;
  port: number;
  streamPath: string | null;
}

export class SurveillanceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SurveillanceValidationError";
  }
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SurveillanceValidationError(`${field} est obligatoire`);
  }

  return value.trim();
}

/**
 * Validates the shape of a future camera endpoint without making a network
 * connection. A future server-side connector must additionally use
 * validateOutboundUrl (or an equivalent gateway policy) before connecting.
 */
export function validateSurveillanceEndpoint(input: {
  protocol: unknown;
  host: unknown;
  port: unknown;
  streamPath?: unknown;
}): SurveillanceEndpoint {
  const protocol = requireNonEmptyString(input.protocol, "protocol");
  if (
    !SURVEILLANCE_PROTOCOLS.includes(
      protocol as (typeof SURVEILLANCE_PROTOCOLS)[number],
    )
  ) {
    throw new SurveillanceValidationError("Protocole caméra non autorisé");
  }

  const host = requireNonEmptyString(input.host, "host");
  if (
    host.length > 253 ||
    host.includes("/") ||
    host.includes("@") ||
    /\s/.test(host) ||
    host.includes(":") && !host.startsWith("[")
  ) {
    throw new SurveillanceValidationError("Hôte caméra invalide");
  }

  const port =
    typeof input.port === "number"
      ? input.port
      : typeof input.port === "string" && input.port.trim() !== ""
        ? Number(input.port)
        : NaN;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new SurveillanceValidationError("Port caméra invalide");
  }

  const streamPath =
    input.streamPath === undefined || input.streamPath === null
      ? null
      : requireNonEmptyString(input.streamPath, "streamPath");
  if (
    streamPath !== null &&
    (!streamPath.startsWith("/") ||
      streamPath.includes("\r") ||
      streamPath.includes("\n") ||
      streamPath.length > 2048)
  ) {
    throw new SurveillanceValidationError("Chemin de flux invalide");
  }

  return {
    protocol: protocol as SurveillanceProtocol,
    host,
    port,
    streamPath,
  };
}

export function toSurveillanceCameraDto(
  camera: StoredSurveillanceCamera,
): SurveillanceCameraDto {
  return {
    id: camera.id,
    name: camera.name,
    description: camera.description ?? null,
    protocol: camera.protocol,
    host: camera.host,
    port: camera.port,
    streamPath: camera.streamPath ?? null,
    status: camera.status,
    lastSeenAt: camera.lastSeenAt?.toISOString() ?? null,
    createdAt: camera.createdAt.toISOString(),
    updatedAt: camera.updatedAt.toISOString(),
  };
}

/**
 * Defense in depth for ownership checks. Future database queries must still
 * include the owner in their WHERE clause and use authorization middleware.
 */
export function ownsSurveillanceCamera(
  authenticatedUserId: string,
  cameraOwnerUserId: string,
): boolean {
  return (
    authenticatedUserId.trim() !== "" &&
    cameraOwnerUserId.trim() !== "" &&
    authenticatedUserId === cameraOwnerUserId
  );
}

export interface SurveillanceVideoTokenClaims {
  userId: string;
  cameraId: string;
  scope: typeof SURVEILLANCE_VIDEO_SCOPE;
  iat: number;
  exp: number;
  jti: string;
}

function isValidTemporaryVideoToken(
  claims: Partial<SurveillanceVideoTokenClaims>,
  nowSeconds: number,
): claims is SurveillanceVideoTokenClaims {
  const iat = claims.iat;
  const exp = claims.exp;
  if (
    typeof claims.userId !== "string" ||
    claims.userId.trim() === "" ||
    typeof claims.cameraId !== "string" ||
    claims.cameraId.trim() === "" ||
    claims.scope !== SURVEILLANCE_VIDEO_SCOPE ||
    typeof claims.jti !== "string" ||
    claims.jti.trim() === "" ||
    !Number.isInteger(iat) ||
    !Number.isInteger(exp)
  ) {
    return false;
  }

  const ttl = exp - iat;
  return (
    exp > nowSeconds &&
    iat <= nowSeconds &&
    ttl > 0 &&
    ttl <= MAX_SURVEILLANCE_VIDEO_TOKEN_TTL_SECONDS
  );
}

export function assertTemporarySurveillanceVideoToken(
  claims: Partial<SurveillanceVideoTokenClaims>,
  nowSeconds = Math.floor(Date.now() / 1000),
): asserts claims is SurveillanceVideoTokenClaims {
  if (!isValidTemporaryVideoToken(claims, nowSeconds)) {
    throw new SurveillanceValidationError(
      "Token vidéo absent, expiré, mal formé ou non temporaire",
    );
  }
}

export function isSurveillanceVideoTokenScopedTo(
  claims: Partial<SurveillanceVideoTokenClaims>,
  userId: string,
  cameraId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  return (
    isValidTemporaryVideoToken(claims, nowSeconds) &&
    claims.userId === userId &&
    claims.cameraId === cameraId
  );
}

export const SURVEILLANCE_NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": "no-store, private",
  Pragma: "no-cache",
} as const);

export function redactSurveillanceLogData(value: unknown): unknown {
  return redactSensitiveData(value);
}