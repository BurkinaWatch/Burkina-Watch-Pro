import crypto from "node:crypto";
import {
  assertVideoStreamAuthorization,
  countViewerAccessForCamera,
  issueViewerAccess,
  revokeViewerAccess,
  type AuthorizedVideoStream,
  type RegisterVideoStreamRequest,
  type RegisteredVideoStream,
  type VideoGateway,
  type VideoGatewayConfig,
  type VideoGatewayStreamRequest,
  type VideoGatewayStreamStatus,
  VideoGatewayCapacityError,
} from "./videoGateway";
import { VideoGatewayUnavailableError } from "./videoGateway";
import {
  SURVEILLANCE_TEST_PATH_NAME,
  SURVEILLANCE_TEST_SOURCE_URL,
} from "./surveillancePrototype";
import { validateOutboundUrl } from "./ssrfProtection";

interface MediaMtxPathResponse {
  ready?: boolean;
  state?: string;
  status?: string;
}

export interface MediaMtxGatewayOptions {
  config: VideoGatewayConfig & {
    enabled: true;
    provider: "mediamtx";
    apiUrl: string;
    publicOrigin: string;
  };
  fetchImpl?: typeof fetch;
}

interface RegisteredPath {
  cameraId: string;
  pathName: string;
  sourceUrl: string;
}

async function assertControlledSourceUrl(
  sourceUrl: string,
  options: MediaMtxGatewayOptions["config"],
) {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new VideoGatewayUnavailableError("Source RTSP de test invalide");
  }

  if (parsed.protocol !== "rtsp:" || parsed.search || parsed.hash) {
    throw new VideoGatewayUnavailableError(
      "Source RTSP non autorisée",
    );
  }
  if (
    options.testMode &&
    (parsed.username ||
      parsed.password ||
      !["127.0.0.1", "localhost", "::1", "host.docker.internal"].includes(
        parsed.hostname,
      ))
  ) {
    throw new VideoGatewayUnavailableError(
      "Seule une source RTSP locale sans credential est autorisée dans le prototype",
    );
  }
  if (!options.testMode && !options.realCameraEnabled) {
    throw new VideoGatewayUnavailableError(
      "Les caméras réelles sont désactivées pour cet environnement",
    );
  }
  if (!options.testMode) {
    try {
      await validateOutboundUrl(sourceUrl, {
        allowedProtocols: ["rtsp"],
        allowCredentials: true,
        allowPrivateNetworks: options.allowPrivateCameraNetwork,
      });
    } catch {
      throw new VideoGatewayUnavailableError("Source RTSP non autorisée");
    }
  }
}

export class MediaMtxVideoGateway implements VideoGateway {
  readonly provider = "mediamtx" as const;
  private readonly fetchImpl: typeof fetch;
  private readonly registeredPaths = new Map<string, RegisteredPath>();

  constructor(private readonly options: MediaMtxGatewayOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    options: { allowNotFound?: boolean } = {},
  ): Promise<T | null> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (this.options.config.apiToken) {
      headers.set(
        "Authorization",
        `Bearer ${this.options.config.apiToken}`,
      );
    }

    let response: Response;
    try {
      response = await this.fetchImpl(
        `${this.options.config.apiUrl}${path}`,
        {
          ...init,
          headers,
        },
      );
    } catch {
      throw new VideoGatewayUnavailableError(
        "La passerelle vidéo est inaccessible",
      );
    }

    if (!response.ok) {
      if (response.status === 404 && options.allowNotFound) {
        return null;
      }
      throw new VideoGatewayUnavailableError(
        `La passerelle vidéo a refusé la requête (${response.status})`,
      );
    }

    if (response.status === 204) return null;
    try {
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }

  async registerStream(
    request: RegisterVideoStreamRequest,
  ): Promise<RegisteredVideoStream> {
    await assertControlledSourceUrl(
      request.sourceUrl,
      this.options.config,
    );

    const existing = this.registeredPaths.get(request.cameraId);
    if (existing) {
      return {
        cameraId: request.cameraId,
        pathName: existing.pathName,
        status: "connecting",
      };
    }

    const isControlledTestSource =
      this.options.config.testMode &&
      request.sourceUrl === SURVEILLANCE_TEST_SOURCE_URL;
    const pathName = isControlledTestSource
      ? SURVEILLANCE_TEST_PATH_NAME
      : `surveillance-${crypto
          .createHmac(
            "sha256",
            this.options.config.pathSecret || this.options.config.publicOrigin,
          )
          .update(request.cameraId)
          .digest("hex")
          .slice(0, 32)}`;
    if (!isControlledTestSource) {
      await this.request(
        `/v3/config/paths/add/${encodeURIComponent(pathName)}`,
        {
          method: "POST",
          body: JSON.stringify({
            source: request.sourceUrl,
            rtspTransport: "tcp",
          }),
        },
      );
    }

    this.registeredPaths.set(request.cameraId, {
      cameraId: request.cameraId,
      pathName,
      sourceUrl: request.sourceUrl,
    });
    return {
      cameraId: request.cameraId,
      pathName,
      status: "connecting",
    };
  }

  async removeStream(cameraId: string): Promise<void> {
    const registered = this.registeredPaths.get(cameraId);
    if (!registered) return;

    if (registered.sourceUrl !== SURVEILLANCE_TEST_SOURCE_URL) {
      await this.request(
        `/v3/config/paths/delete/${encodeURIComponent(registered.pathName)}`,
        { method: "DELETE" },
      );
    }
    this.registeredPaths.delete(cameraId);
  }

  async getStreamStatus(cameraId: string): Promise<VideoGatewayStreamStatus> {
    const registered = this.registeredPaths.get(cameraId);
    if (!registered) return "offline";

    const response = await this.request<MediaMtxPathResponse>(
      `/v3/paths/get/${encodeURIComponent(registered.pathName)}`,
      {},
      { allowNotFound: true },
    );
    if (!response) return "offline";
    if (response?.ready) return "online";
    if (response?.state === "ready") return "online";
    if (response?.state === "notReady") return "offline";
    if (response?.status === "ready") return "online";
    return "connecting";
  }

  async authorizeStream(
    request: VideoGatewayStreamRequest,
  ): Promise<AuthorizedVideoStream> {
    return this.createViewerAccess(request);
  }

  async createViewerAccess(
    request: VideoGatewayStreamRequest,
  ): Promise<AuthorizedVideoStream> {
    assertVideoStreamAuthorization(request);
    const registered = this.registeredPaths.get(request.cameraId);
    if (!registered) {
      throw new VideoGatewayUnavailableError(
        "Le flux caméra n'est pas enregistré auprès de la passerelle",
      );
    }
    if (
      countViewerAccessForCamera(request.cameraId) >=
      this.options.config.maxViewerSessionsPerCamera
    ) {
      throw new VideoGatewayCapacityError();
    }

    const grant = issueViewerAccess({
      userId: request.authenticatedUserId,
      cameraId: request.cameraId,
      pathName: registered.pathName,
      nowSeconds: request.nowSeconds,
    });
    const whepUrl = `${this.options.config.publicOrigin}/${encodeURIComponent(
      registered.pathName,
    )}/whep`;

    return {
      cameraId: request.cameraId,
      userId: request.authenticatedUserId,
      expiresAt: grant.expiresAt,
      gatewaySessionId: grant.sessionId,
      pathName: registered.pathName,
      whepUrl,
      viewerToken: grant.token,
    };
  }

  async revokeViewerAccess(sessionId: string): Promise<void> {
    revokeViewerAccess(sessionId);
  }
}