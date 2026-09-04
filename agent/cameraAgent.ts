export interface CameraAgentClientConfig {
  controlUrl: string;
  production?: boolean;
  fetchImpl?: typeof fetch;
  heartbeatIntervalMs?: number;
}

export interface CameraAgentEnrollment {
  agentId: string;
  enrollmentCode: string;
  version?: string;
}

export interface CameraAgentHeartbeat {
  agentId: string;
  version?: string;
}

function assertControlUrl(controlUrl: string, production: boolean): string {
  const parsed = new URL(controlUrl);
  if (production && parsed.protocol !== "https:") {
    throw new Error("Camera Agent production exige une URL HTTPS");
  }
  if (
    !production &&
    parsed.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
  ) {
    throw new Error("HTTP autorisé uniquement vers localhost en développement");
  }
  return parsed.origin;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Agent arrêté", "AbortError"));
      },
      { once: true },
    );
  });
}

export class CameraAgentClient {
  private readonly controlUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly heartbeatIntervalMs: number;
  private credential: string | null = null;

  constructor(private readonly config: CameraAgentClientConfig) {
    this.controlUrl = assertControlUrl(
      config.controlUrl,
      config.production ?? false,
    );
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 30_000;
  }

  async enroll(input: CameraAgentEnrollment): Promise<void> {
    const response = await this.fetchImpl(
      `${this.controlUrl}/api/surveillance/agents/enroll`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    if (!response.ok) {
      throw new Error(`Enrôlement agent refusé (${response.status})`);
    }
    const payload = (await response.json()) as { agentId?: string; credential?: string };
    if (payload.agentId !== input.agentId || !payload.credential) {
      throw new Error("Réponse d'enrôlement agent invalide");
    }
    // The credential is kept only in the agent process. Production packaging
    // must replace this with an OS secret store, never a project .env copy.
    this.credential = payload.credential;
  }

  async heartbeat(input: CameraAgentHeartbeat): Promise<void> {
    if (!this.credential) {
      throw new Error("Agent non enrôlé");
    }
    const response = await this.fetchImpl(
      `${this.controlUrl}/api/surveillance/agents/heartbeat`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.credential}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );
    if (!response.ok) {
      if (response.status === 401) this.credential = null;
      throw new Error(`Heartbeat agent refusé (${response.status})`);
    }
  }

  async run(
    input: CameraAgentHeartbeat,
    signal: AbortSignal,
  ): Promise<void> {
    let attempt = 0;
    while (!signal.aborted) {
      try {
        await this.heartbeat(input);
        attempt = 0;
        await wait(this.heartbeatIntervalMs, signal);
      } catch (error) {
        if (signal.aborted) return;
        const delay = Math.min(60_000, 1_000 * 2 ** Math.min(attempt, 6));
        attempt += 1;
        await wait(delay, signal);
        if (error instanceof Error && error.message.includes("401")) {
          throw error;
        }
      }
    }
  }
}