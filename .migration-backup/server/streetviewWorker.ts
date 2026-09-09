import { randomUUID } from "node:crypto";
import { storage } from "./storage";
import { inspectStreetviewStoredObject } from "./streetviewPreparationService";
import { runStreetviewCpuPreparation } from "./streetviewCpuPreparation";
import { cpuReconstructionEngine } from "./streetviewReconstruction";
import {
  classifyStreetviewError,
  isRetryableStreetviewError,
  retryDelayMs,
} from "./streetviewProcessing";

export type StreetviewPreparationWaitingState =
  | "WAITING_FOR_RECONSTRUCTION"
  | "WAITING_FOR_GPU";

export function resolveStreetviewPreparationWaitingState(
  availability: { status: "AVAILABLE" | "WAITING_FOR_GPU" | "UNAVAILABLE" },
): StreetviewPreparationWaitingState {
  return availability.status === "WAITING_FOR_GPU"
    ? "WAITING_FOR_GPU"
    : "WAITING_FOR_RECONSTRUCTION";
}

export function isStreetviewContributionCpuPrepared(status: string, processedAt: Date | null): boolean {
  return (
    ["WAITING_FOR_RECONSTRUCTION", "WAITING_FOR_GPU", "WAITING_FOR_3D"].includes(status) &&
    Boolean(processedAt)
  );
}

const numberFromEnv = (name: string, fallback: number, minimum: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= minimum ? value : fallback;
};

const publicFailureMessage = (code: string): string => {
  switch (code) {
    case "FILE_NOT_FOUND":
      return "Le fichier vidéo est introuvable.";
    case "INVALID_VIDEO_SIZE":
    case "INVALID_VIDEO_CONTAINER":
    case "UNSUPPORTED_MIME_TYPE":
    case "INVALID_METADATA":
      return "Les informations de la vidéo ne sont pas valides.";
    case "STORAGE_UNAVAILABLE":
    case "NETWORK_TEMPORARY":
    case "WORKER_TIMEOUT":
      return "Le traitement sera retenté automatiquement.";
    default:
      return "La préparation de la vidéo a échoué.";
  }
};

export class StreetviewWorker {
  readonly workerId: string;
  private timer: NodeJS.Timeout | undefined;
  private running = false;
  private stopped = false;

  constructor(workerId = process.env.STREETVIEW_WORKER_ID?.trim() || `streetview-${randomUUID()}`) {
    this.workerId = workerId;
  }

  async processNext(): Promise<boolean> {
    if (this.stopped) return false;
    await storage.recoverAbandonedStreetviewProcessingJobs();
    const job = await storage.claimNextStreetviewProcessingJob(
      this.workerId,
      numberFromEnv("STREETVIEW_WORKER_LEASE_MS", 5 * 60_000, 1_000),
    );
    if (!job) return false;

    const context = `[StreetView] Contribution ${job.contributionId} Job ${job.id}`;
    console.log(`${context} STARTED attempt=${job.attempts}`);
    try {
      const contribution = await storage.getStreetviewContribution(job.contributionId);
      if (!contribution) throw new Error("FILE_NOT_FOUND");

      if (isStreetviewContributionCpuPrepared(contribution.status, contribution.processedAt)) {
        await storage.updateStreetviewProcessingJob(job.id, {
          status: "COMPLETED",
          progress: 100,
          completedAt: new Date(),
          lockedAt: null,
          leaseUntil: null,
          lockedBy: null,
        });
        console.log(`${context} COMPLETED idempotent=true`);
        return true;
      }

      if (!contribution.storageKey || !contribution.mediaType) {
        throw new Error("FILE_NOT_FOUND");
      }

      await storage.updateStreetviewContribution(contribution.id, {
        status: "VALIDATING",
        progress: 20,
        statusMessage: "Validation de la vidéo en cours",
        errorCode: null,
        updatedAt: new Date(),
      });
      await storage.updateStreetviewProcessingJob(job.id, { progress: 20 });

      const metadata = await inspectStreetviewStoredObject(
        contribution.storageKey,
        contribution.mediaType,
      );
      await storage.updateStreetviewProcessingJob(job.id, { progress: 50 });
      await storage.updateStreetviewContribution(contribution.id, {
        status: "PROCESSING",
        progress: 60,
        statusMessage: "Préparation des métadonnées terminée",
        fileSizeBytes: metadata.fileSizeBytes,
        clientMetadata: {
          ...(contribution.clientMetadata && typeof contribution.clientMetadata === "object" &&
          !Array.isArray(contribution.clientMetadata) ? contribution.clientMetadata : {}),
          validatedAt: new Date().toISOString(),
          storageContentType: metadata.contentType,
          storageEtag: metadata.etag,
        },
        updatedAt: new Date(),
      });
      await storage.updateStreetviewProcessingJob(job.id, { progress: 80 });

      const cpuPreparation = await runStreetviewCpuPreparation(
        contribution.id,
        contribution.storageKey,
      );
      const reconstructionAvailability = await cpuReconstructionEngine.getAvailability();
      const nextStatus = resolveStreetviewPreparationWaitingState(reconstructionAvailability);
      const preparationMessage = reconstructionAvailability.status === "WAITING_FOR_GPU"
        ? `${cpuPreparation.message} ${reconstructionAvailability.reason}`
        : cpuPreparation.message;

      await storage.updateStreetviewContribution(contribution.id, {
        status: nextStatus,
        progress: 100,
        statusMessage: preparationMessage,
        processedAt: new Date(),
        errorCode: null,
        qualityMetrics: cpuPreparation.qualityMetrics,
        clientMetadata: {
          ...(contribution.clientMetadata && typeof contribution.clientMetadata === "object" &&
          !Array.isArray(contribution.clientMetadata) ? contribution.clientMetadata : {}),
          cpuPreparation: {
            capability: cpuPreparation.capability,
            artifactKeys: cpuPreparation.artifactKeys,
            reconstruction: reconstructionAvailability,
          },
        },
        updatedAt: new Date(),
      });
      await storage.updateStreetviewProcessingJob(job.id, {
        status: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
        lockedAt: null,
        leaseUntil: null,
        lockedBy: null,
      });
      console.log(`${context} COMPLETED`);
      return true;
    } catch (error) {
      const classified = classifyStreetviewError(error);
      const shouldRetry = classified.retryable && job.attempts < job.maxAttempts;
      const now = new Date();
      console.error(`${context} ${shouldRetry ? "RETRYING" : "FAILED"} errorCode=${classified.code}`);
      console.error(`${context} technical=${classified.technicalMessage.slice(0, 300)}`);

      if (shouldRetry) {
        await storage.updateStreetviewProcessingJob(job.id, {
          status: "QUEUED",
          availableAt: new Date(now.getTime() + retryDelayMs(job.attempts)),
          errorCode: classified.code,
          errorMessage: classified.technicalMessage.slice(0, 1000),
          lockedAt: null,
          leaseUntil: null,
          lockedBy: null,
        });
        await storage.updateStreetviewContribution(job.contributionId, {
          status: "QUEUED",
          progress: Math.min(90, Math.max(20, job.progress)),
          statusMessage: publicFailureMessage(classified.code),
          errorCode: classified.code,
          updatedAt: now,
        });
      } else {
        await storage.updateStreetviewProcessingJob(job.id, {
          status: "FAILED",
          progress: 100,
          errorCode: classified.code,
          errorMessage: classified.technicalMessage.slice(0, 1000),
          completedAt: now,
          lockedAt: null,
          leaseUntil: null,
          lockedBy: null,
        });
        await storage.updateStreetviewContribution(job.contributionId, {
          status: classified.code.startsWith("INVALID") || classified.code === "UNSUPPORTED_MIME_TYPE"
            ? "VALIDATION_FAILED"
            : "PROCESSING_FAILED",
          progress: 100,
          statusMessage: publicFailureMessage(classified.code),
          errorCode: classified.code,
          updatedAt: now,
        });
      }
      return true;
    }
  }

  async start(): Promise<void> {
    if (this.timer) return;
    this.stopped = false;
    const pollMs = numberFromEnv("STREETVIEW_WORKER_POLL_MS", 2_000, 250);
    const tick = async () => {
      if (this.running || this.stopped) return;
      this.running = true;
      try {
        await this.processNext();
      } catch (error) {
        console.error("[StreetView] worker poll failed:", error);
      } finally {
        this.running = false;
      }
    };
    await tick();
    this.timer = setInterval(() => void tick(), pollMs);
    console.log(`[StreetView] worker ${this.workerId} started pollMs=${pollMs}`);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    if (this.running) {
      while (this.running) await new Promise((resolve) => setTimeout(resolve, 25));
    }
    console.log(`[StreetView] worker ${this.workerId} stopped`);
  }
}

export const streetviewWorker = new StreetviewWorker();