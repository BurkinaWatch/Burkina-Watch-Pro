import crypto from "node:crypto";
import {
  assertVideoStreamAuthorization,
  issueViewerAccess,
  revokeViewerAccess,
  type AuthorizedVideoStream,
  type RegisterVideoStreamRequest,
  type RegisteredVideoStream,
  type VideoGateway,
  type VideoGatewayConfig,
  type VideoGatewayStreamRequest,
  type VideoGatewayStreamStatus,
} from "./videoGateway";
import { VideoGatewayUnavailableError } from "./videoGateway";

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
}

function assertControlledSourceUrl(sourceUrl: string, testMode: boolean) {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new VideoGatewayUnavailableError("Source RTSP de test invalide");
  }

  const localHosts = new Set([
    "127.0.0.1",
    "localhost",
    "::1",
    "host.docker.internal",
  ]);
  if (
    parsed.protocol !== "rtsp:" ||
    parsed.username ||
    parsed.password ||
    (!testMode && !localHosts.has(parsed.hostname)) ||
    parsed.search ||
    parsed.hash
  ) {
    throw new VideoGatewayUnavailableError(
      "Seule une source RTSP locale sans credential est autorisée dans le prototype",
    );
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
    assertControlledSourceUrl(
      request.sourceUrl,
      this.options.config.testMode,
    );

    const existing = this.registeredPaths.get(request.cameraId);
    if (existing) {
      return {
        cameraId: request.cameraId,
        pathName: existing.pathName,
        status: "connecting",
      };
    }

    const pathName = `phase5-${crypto.randomBytes(12).toString("base64url")}`;
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

    this.registeredPaths.set(request.cameraId, {
      cameraId: request.cameraId,
      pathName,
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

    await this.request(
      `/v3/config/paths/delete/${encodeURIComponent(registered.pathName)}`,
      { method: "DELETE" },
    );
    this.registeredPaths.delete(cameraId);
  }

  async getStreamStatus(cameraId: string): Promise<VideoGatewayStreamStatus> {
    const registered = this.registeredPaths.get(cameraId);
    if (!registered) return "offline";

    const response = await this.request<MediaMtxPathResponse>(
      `/v3/paths/get/${encodeURIComponent(registered.pathName)}`,
    );
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