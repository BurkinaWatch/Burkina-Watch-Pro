import { storage } from "./storage";
import { streetviewConfig } from "./streetviewConfig";
import {
  headStreetviewObject,
  readStreetviewObjectRange,
} from "./streetviewStorage";

function isSupportedVideoBuffer(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "video/webm") {
    return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  }

  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    return buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }

  return false;
}

async function markPreparationStarted(jobId: string, contributionId: string): Promise<void> {
  await storage.updateStreetviewProcessingJob(jobId, {
    status: "PROCESSING",
    progress: 10,
    attempts: 1,
    startedAt: new Date(),
  });
  await storage.updateStreetviewContribution(contributionId, {
    status: "VALIDATING",
    progress: 15,
    statusMessage: "Validation de la vidéo en cours",
    errorCode: null,
    updatedAt: new Date(),
  });
}

async function finishPreparation(
  jobId: string,
  contributionId: string,
  validate: () => Promise<void>,
): Promise<void> {
  await markPreparationStarted(jobId, contributionId);
  try {
    await validate();
    await storage.updateStreetviewProcessingJob(jobId, {
      status: "COMPLETED",
      progress: 100,
      completedAt: new Date(),
    });
    await storage.updateStreetviewContribution(contributionId, {
      status: "WAITING_FOR_3D",
      progress: 100,
      statusMessage: "En attente de reconstruction 3D",
      processedAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error: any) {
    const errorCode = typeof error?.message === "string" ? error.message : "PREPARATION_FAILED";
    await storage.updateStreetviewProcessingJob(jobId, {
      status: "FAILED",
      progress: 100,
      errorCode,
      errorMessage: "StreetView preparation failed",
      completedAt: new Date(),
    });
    await storage.updateStreetviewContribution(contributionId, {
      status: errorCode === "INVALID_VIDEO_CONTAINER" || errorCode === "UNSUPPORTED_MIME_TYPE"
        ? "VALIDATION_FAILED"
        : "PROCESSING_FAILED",
      progress: 100,
      statusMessage: "La vidéo n'a pas pu être validée",
      errorCode,
      updatedAt: new Date(),
    });
  }
}

function validateVideoMetadata(
  buffer: Buffer,
  mimeType: string,
  fileSizeBytes: number,
): void {
  if (!streetviewConfig.allowedMimeTypes.includes(mimeType as never)) {
    throw new Error("UNSUPPORTED_MIME_TYPE");
  }
  if (fileSizeBytes === 0 || fileSizeBytes > streetviewConfig.maxVideoBytes) {
    throw new Error("INVALID_VIDEO_SIZE");
  }
  if (!isSupportedVideoBuffer(buffer, mimeType)) {
    throw new Error("INVALID_VIDEO_CONTAINER");
  }
}

export async function runStreetviewPreparation(
  jobId: string,
  contributionId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<void> {
  await finishPreparation(jobId, contributionId, async () => {
    validateVideoMetadata(buffer, mimeType, buffer.length);
    // Phase 3 deliberately stops here. No photogrammetry, NeRF or Gaussian
    // Splatting is invoked. The job prepares the contribution for a future
    // reconstruction worker only.
  });
}

export async function runStreetviewStoredObjectPreparation(
  jobId: string,
  contributionId: string,
  storageKey: string,
  mimeType: string,
): Promise<void> {
  await finishPreparation(jobId, contributionId, async () => {
    const head = await headStreetviewObject(storageKey);
    const header = await readStreetviewObjectRange(storageKey, 0, 63);
    validateVideoMetadata(header, mimeType, head.contentLength);
  });
}