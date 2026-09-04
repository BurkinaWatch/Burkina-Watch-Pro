import crypto from "node:crypto";
import {
  assertTemporarySurveillanceVideoToken,
  isSurveillanceVideoTokenScopedTo,
  ownsSurveillanceCamera,
  type SurveillanceCameraStatus,
  type SurveillanceVideoTokenClaims,
} from "./surveillancePreparation";

/**
 * Phase 4 control-plane contract.
 *
 * This module deliberately does not open sockets, call MediaMTX, proxy media,
 * or expose an Express route. A real adapter can be added only after the
 * gateway, deployment, and end-to-end test environment have been approved.
 */

export const VIDEO_GATEWAY_PROVIDERS = ["disabled", "mediamtx"] as const;
export type VideoGatewayProvider = (typeof VIDEO_GATEWAY_PROVIDERS)[number];
export const VIDEO_GATEWAY_STREAM_TTL_SECONDS = 60;

export interface VideoGatewayConfig {
  enabled: boolean;
  provider: VideoGatewayProvider;
  apiUrl: string | null;
  publicOrigin: string | null;
  apiToken: string | null;
  testMode: boolean;
}

export class VideoGatewayConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoGatewayConfigurationError";
  }
}

export class VideoGatewayAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoGatewayAuthorizationError";
  }
}

export class VideoGatewayUnavailableError extends Error {
  constructor(message = "La passerelle vidéo n'est pas disponible") {
    super(message);
    this.name = "VideoGatewayUnavailableError";
  }
}

export interface VideoGatewayStreamRequest {
  authenticatedUserId: string;
  cameraId: string;
  cameraOwnerUserId: string;
  cameraStatus: SurveillanceCameraStatus;
  tokenClaims: Partial<SurveillanceVideoTokenClaims>;
  nowSeconds?: number;
}

export interface RegisterVideoStreamRequest {
  cameraId: string;
  sourceUrl: string;
}

export interface RegisteredVideoStream {
  cameraId: string;
  pathName: string;
  status: VideoGatewayStreamStatus;
}

export type VideoGatewayStreamStatus =
  | "unknown"
  | "connecting"
  | "online"
  | "offline"
  | "error";

export interface AuthorizedVideoStream {
  cameraId: string;
  userId: string;
  expiresAt: number;
  gatewaySessionId: string;
  pathName: string;
  whepUrl: string;
  viewerToken: string;
}

export interface VideoGateway {
  readonly provider: VideoGatewayProvider;
  registerStream(
    request: RegisterVideoStreamRequest,
  ): Promise<RegisteredVideoStream>;
  removeStream(cameraId: string): Promise<void>;
  getStreamStatus(cameraId: string): Promise<VideoGatewayStreamStatus>;
  authorizeStream(
    request: VideoGatewayStreamRequest,
  ): Promise<AuthorizedVideoStream>;
  createViewerAccess(
    request: VideoGatewayStreamRequest,
  ): Promise<AuthorizedVideoStream>;
  revokeViewerAccess(sessionId: string): Promise<void>;
}

export interface ViewerAccessGrant {
  token: string;
  sessionId: string;
  userId: string;
  cameraId: string;
  pathName: string;
  expiresAt: number;
}

const viewerAccessGrants = new Map<string, ViewerAccessGrant>();

function cleanupExpiredViewerAccess(nowSeconds = Math.floor(Date.now() / 1000)) {
  for (const [token, grant] of viewerAccessGrants) {
    if (grant.expiresAt <= nowSeconds) {
      viewerAccessGrants.delete(token);
    }
  }
}

export function issueViewerAccess(input: {
  userId: string;
  cameraId: string;
  pathName: string;
  nowSeconds?: number;
}): ViewerAccessGrant {
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  cleanupExpiredViewerAccess(nowSeconds);
  const grant: ViewerAccessGrant = {
    token: crypto.randomBytes(32).toString("base64url"),
    sessionId: crypto.randomUUID(),
    userId: input.userId,
    cameraId: input.cameraId,
    pathName: input.pathName,
    expiresAt: nowSeconds + VIDEO_GATEWAY_STREAM_TTL_SECONDS,
  };
  viewerAccessGrants.set(grant.token, grant);
  return grant;
}

export function validateViewerAccess(
  token: string,
  pathName: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): ViewerAccessGrant | null {
  cleanupExpiredViewerAccess(nowSeconds);
  const grant = viewerAccessGrants.get(token);
  if (
    !grant ||
    grant.expiresAt <= nowSeconds ||
    grant.pathName !== pathName
  ) {
    return null;
  }
  return grant;
}

export function revokeViewerAccess(sessionId: string): boolean {
  for (const [token, grant] of viewerAccessGrants) {
    if (grant.sessionId === sessionId) {
      viewerAccessGrants.delete(token);
      return true;
    }
  }
  return false;
}

function parseServiceUrl(
  value: string,
  label: string,
  allowLocalHttp: boolean,
): string {
  let origin: URL;
  try {
    origin = new URL(value);
  } catch {
    throw new VideoGatewayConfigurationError(
      `${label} de la passerelle vidéo est invalide`,
    );
  }

  const isLocalHost = ["127.0.0.1", "localhost", "::1"].includes(
    origin.hostname,
  );
  const allowedProtocol =
    origin.protocol === "https:" ||
    (allowLocalHttp && origin.protocol === "http:" && isLocalHost);

  if (
    !allowedProtocol ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password
  ) {
    throw new VideoGatewayConfigurationError(
      `${label} doit être une origine HTTPS sans credentials`,
    );
  }

  return origin.origin;
}

/**
 * Reads an inactive-by-default configuration. The provider name is retained
 * for a future adapter, but "mediamtx" cannot be activated until that adapter
 * is implemented and explicitly tested.
 */
export function readVideoGatewayConfig(
  env: NodeJS.ProcessEnv = process.env,
): VideoGatewayConfig {
  const enabled = env.VIDEO_GATEWAY_ENABLED === "true";
  const provider = (env.VIDEO_GATEWAY_PROVIDER || "disabled").trim().toLowerCase();
  const testMode =
    env.VIDEO_GATEWAY_TEST_MODE === "true" && env.NODE_ENV !== "production";

  if (
    !VIDEO_GATEWAY_PROVIDERS.includes(
      provider as (typeof VIDEO_GATEWAY_PROVIDERS)[number],
    )
  ) {
    throw new VideoGatewayConfigurationError(
      "Fournisseur de passerelle vidéo non autorisé",
    );
  }

  if (!enabled) {
    return {
      enabled: false,
      provider: "disabled",
      apiUrl: null,
      publicOrigin: null,
      apiToken: null,
      testMode,
    };
  }

  if (provider !== "mediamtx") {
    throw new VideoGatewayConfigurationError(
      "Une passerelle vidéo active doit utiliser un adaptateur explicitement supporté",
    );
  }

  const configuredApiUrl = env.VIDEO_GATEWAY_API_URL?.trim();
  const configuredPublicOrigin = env.VIDEO_GATEWAY_PUBLIC_ORIGIN?.trim();
  if (!configuredApiUrl || !configuredPublicOrigin) {
    throw new VideoGatewayConfigurationError(
      "VIDEO_GATEWAY_API_URL et VIDEO_GATEWAY_PUBLIC_ORIGIN sont obligatoires lorsque la passerelle est active",
    );
  }
  if (!testMode && !env.VIDEO_GATEWAY_API_TOKEN?.trim()) {
    throw new VideoGatewayConfigurationError(
      "VIDEO_GATEWAY_API_TOKEN est obligatoire hors mode de test",
    );
  }

  return {
    enabled: true,
    provider: "mediamtx",
    apiUrl: parseServiceUrl(
      configuredApiUrl,
      "VIDEO_GATEWAY_API_URL",
      testMode,
    ),
    publicOrigin: parseServiceUrl(
      configuredPublicOrigin,
      "VIDEO_GATEWAY_PUBLIC_ORIGIN",
      testMode,
    ),
    apiToken: env.VIDEO_GATEWAY_API_TOKEN?.trim() || null,
    testMode,
  };
}

export function assertVideoStreamAuthorization(
  request: VideoGatewayStreamRequest,
): asserts request is VideoGatewayStreamRequest & {
  tokenClaims: SurveillanceVideoTokenClaims;
  nowSeconds: number;
} {
  const nowSeconds = request.nowSeconds ?? Math.floor(Date.now() / 1000);

  if (
    request.authenticatedUserId.trim() === "" ||
    request.cameraId.trim() === "" ||
    !ownsSurveillanceCamera(
      request.authenticatedUserId,
      request.cameraOwnerUserId,
    )
  ) {
    throw new VideoGatewayAuthorizationError(
      "Accès au flux caméra non autorisé",
    );
  }

  if (request.cameraStatus === "disabled") {
    throw new VideoGatewayAuthorizationError("Caméra désactivée");
  }

  try {
    assertTemporarySurveillanceVideoToken(request.tokenClaims, nowSeconds);
  } catch {
    throw new VideoGatewayAuthorizationError(
      "Autorisation vidéo absente, expirée ou mal formée",
    );
  }

  if (
    !isSurveillanceVideoTokenScopedTo(
      request.tokenClaims,
      request.authenticatedUserId,
      request.cameraId,
      nowSeconds,
    )
  ) {
    throw new VideoGatewayAuthorizationError(
      "Autorisation vidéo non associée à cette caméra",
    );
  }

  Object.assign(request, { nowSeconds });
}

/**
 * Safe default used until a real gateway has passed architecture and
 * end-to-end validation. It makes gateway failure explicit and testable.
 */
export class DisabledVideoGateway implements VideoGateway {
  readonly provider = "disabled" as const;

  async registerStream(
    _request: RegisterVideoStreamRequest,
  ): Promise<RegisteredVideoStream> {
    throw new VideoGatewayUnavailableError(
      "La passerelle vidéo est désactivée pour cette phase",
    );
  }

  async removeStream(_cameraId: string): Promise<void> {
    throw new VideoGatewayUnavailableError(
      "La passerelle vidéo est désactivée pour cette phase",
    );
  }

  async getStreamStatus(
    _cameraId: string,
  ): Promise<VideoGatewayStreamStatus> {
    throw new VideoGatewayUnavailableError(
      "La passerelle vidéo est désactivée pour cette phase",
    );
  }

  async authorizeStream(
    _request: VideoGatewayStreamRequest,
  ): Promise<AuthorizedVideoStream> {
    throw new VideoGatewayUnavailableError(
      "La passerelle vidéo est désactivée pour cette phase",
    );
  }

  async createViewerAccess(
    _request: VideoGatewayStreamRequest,
  ): Promise<AuthorizedVideoStream> {
    throw new VideoGatewayUnavailableError(
      "La passerelle vidéo est désactivée pour cette phase",
    );
  }

  async revokeViewerAccess(_sessionId: string): Promise<void> {
    throw new VideoGatewayUnavailableError(
      "La passerelle vidéo est désactivée pour cette phase",
    );
  }
}

export function createVideoGateway(
  config: VideoGatewayConfig = readVideoGatewayConfig(),
): VideoGateway {
  if (!config.enabled) {
    return new DisabledVideoGateway();
  }

  throw new VideoGatewayUnavailableError(
    `L'adaptateur ${config.provider} n'est pas encore activé`,
  );
}