import { storage } from "./storage";
import { streetviewConfig } from "./streetviewConfig";

function isSupportedVideoBuffer(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "video/webm") {
    return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  }

  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    return buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }

  return false;
}

export async function runStreetviewPreparation(
  jobId: string,
  contributionId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<void> {
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

  try {
    if (!streetviewConfig.allowedMimeTypes.includes(mimeType as never)) {
      throw new Error("UNSUPPORTED_MIME_TYPE");
    }
    if (buffer.length === 0 || buffer.length > streetviewConfig.maxVideoBytes) {
      throw new Error("INVALID_VIDEO_SIZE");
    }
    if (!isSupportedVideoBuffer(buffer, mimeType)) {
      throw new Error("INVALID_VIDEO_CONTAINER");
    }

    // Phase 3 deliberately stops here. No photogrammetry, NeRF or Gaussian
    // Splatting is invoked. The job prepares the contribution for a future
    // reconstruction worker only.
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