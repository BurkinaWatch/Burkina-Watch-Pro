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

export interface VideoGatewayConfig {
  enabled: boolean;
  provider: VideoGatewayProvider;
  origin: string | null;
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

export interface AuthorizedVideoStream {
  cameraId: string;
  userId: string;
  expiresAt: number;
  gatewaySessionId: string;
}

export interface VideoGateway {
  readonly provider: VideoGatewayProvider;
  authorizeStream(
    request: VideoGatewayStreamRequest,
  ): Promise<AuthorizedVideoStream>;
}

function parseOrigin(value: string): string {
  let origin: URL;
  try {
    origin = new URL(value);
  } catch {
    throw new VideoGatewayConfigurationError(
      "L'origine de la passerelle vidéo est invalide",
    );
  }

  if (
    origin.protocol !== "https:" ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password
  ) {
    throw new VideoGatewayConfigurationError(
      "L'origine de la passerelle vidéo doit être une origine HTTPS sans credentials",
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
      origin: null,
    };
  }

  if (provider !== "mediamtx") {
    throw new VideoGatewayConfigurationError(
      "Une passerelle vidéo active doit utiliser un adaptateur explicitement supporté",
    );
  }

  const configuredOrigin = env.VIDEO_GATEWAY_ORIGIN?.trim();
  if (!configuredOrigin) {
    throw new VideoGatewayConfigurationError(
      "VIDEO_GATEWAY_ORIGIN est obligatoire lorsque la passerelle est active",
    );
  }

  return {
    enabled: true,
    provider: "mediamtx",
    origin: parseOrigin(configuredOrigin),
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

  async authorizeStream(
    _request: VideoGatewayStreamRequest,
  ): Promise<AuthorizedVideoStream> {
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