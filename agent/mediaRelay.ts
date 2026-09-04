import crypto from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";

export type MediaRelayStatus =
  | "idle"
  | "connecting"
  | "published"
  | "disconnected"
  | "stopped"
  | "error";

export interface CameraAgentMediaRelayOptions {
  agentId: string;
  cameraId: string;
  streamId: string;
  sourceUrl: string;
  mediaOrigin: string;
  publisherUsername: string;
  publisherPassword: string;
  pathSecret: string;
  testMode?: boolean;
  onStatus?: (status: MediaRelayStatus) => void;
  spawnImpl?: typeof spawn;
}

function assertLocalRtspUrl(value: string, label: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} RTSP invalide`);
  }
  if (parsed.protocol !== "rtsp:") {
    throw new Error(`${label} doit utiliser RTSP`);
  }
  if (
    !["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)
  ) {
    throw new Error(`${label} doit rester local dans le prototype`);
  }
  return parsed;
}

export function deriveAgentStreamPath(
  agentId: string,
  cameraId: string,
  streamId: string,
  pathSecret: string,
): string {
  const digest = crypto
    .createHmac("sha256", pathSecret)
    .update(`${agentId}:${cameraId}:${streamId}`)
    .digest("hex")
    .slice(0, 32);
  return `surveillance-${digest}`;
}

export function buildMediaRelayArgs(
  sourceUrl: string,
  publishUrl: string,
): string[] {
  return [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-nostdin",
    "-rtsp_transport",
    "tcp",
    "-i",
    sourceUrl,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-c:v",
    "copy",
    "-c:a",
    "copy",
    "-f",
    "rtsp",
    "-rtsp_transport",
    "tcp",
    publishUrl,
  ];
}

export class CameraAgentMediaRelay {
  private readonly spawnImpl: typeof spawn;
  private process: ChildProcess | null = null;
  private stopped = true;
  private retryAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private status: MediaRelayStatus = "idle";

  constructor(private readonly options: CameraAgentMediaRelayOptions) {
    if (!options.testMode) {
      throw new Error("Le relais média est limité au mode test local");
    }
    assertLocalRtspUrl(options.sourceUrl, "Source");
    assertLocalRtspUrl(options.mediaOrigin, "Destination");
    if (!options.publisherUsername || !options.publisherPassword) {
      throw new Error("Credential publisher dédié obligatoire");
    }
    if (!options.pathSecret) {
      throw new Error("Secret de path obligatoire");
    }
    this.spawnImpl = options.spawnImpl ?? spawn;
  }

  getStatus(): MediaRelayStatus {
    return this.status;
  }

  getStreamPath(): string {
    return deriveAgentStreamPath(
      this.options.agentId,
      this.options.cameraId,
      this.options.streamId,
      this.options.pathSecret,
    );
  }

  private setStatus(status: MediaRelayStatus): void {
    this.status = status;
    this.options.onStatus?.(status);
  }

  private buildPublishUrl(): string {
    const origin = assertLocalRtspUrl(this.options.mediaOrigin, "Destination");
    origin.username = this.options.publisherUsername;
    origin.password = this.options.publisherPassword;
    origin.pathname = `/${this.getStreamPath()}`;
    origin.search = "";
    origin.hash = "";
    return origin.toString();
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) return;
    const delay = Math.min(60_000, 1_000 * 2 ** Math.min(this.retryAttempt, 6));
    this.retryAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.startProcess();
    }, delay);
  }

  private startProcess(): void {
    if (this.stopped || this.process) return;
    this.setStatus("connecting");
    const child = this.spawnImpl(
      "ffmpeg",
      buildMediaRelayArgs(this.options.sourceUrl, this.buildPublishUrl()),
      { stdio: ["ignore", "ignore", "ignore"] },
    );
    this.process = child;
    child.once("spawn", () => {
      if (!this.stopped) {
        this.retryAttempt = 0;
        this.setStatus("published");
      }
    });
    child.once("error", () => {
      this.process = null;
      this.setStatus("error");
      this.scheduleReconnect();
    });
    child.once("exit", () => {
      this.process = null;
      if (this.stopped) {
        this.setStatus("stopped");
        return;
      }
      this.setStatus("disconnected");
      this.scheduleReconnect();
    });
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.retryAttempt = 0;
    this.startProcess();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const child = this.process;
    this.process = null;
    if (child) child.kill("SIGTERM");
    this.setStatus("stopped");
  }
}