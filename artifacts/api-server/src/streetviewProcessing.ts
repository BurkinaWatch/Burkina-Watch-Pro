export const streetviewErrorCodes = [
  "INVALID_VIDEO_SIZE",
  "INVALID_VIDEO_CONTAINER",
  "UNSUPPORTED_MIME_TYPE",
  "FILE_NOT_FOUND",
  "STORAGE_UNAVAILABLE",
  "NETWORK_TEMPORARY",
  "INVALID_METADATA",
  "PROCESSING_ERROR",
  "INTERNAL_ERROR",
  "WORKER_TIMEOUT",
] as const;

export type StreetviewErrorCode = typeof streetviewErrorCodes[number];

const retryableErrorCodes = new Set<StreetviewErrorCode>([
  "STORAGE_UNAVAILABLE",
  "NETWORK_TEMPORARY",
  "INTERNAL_ERROR",
  "WORKER_TIMEOUT",
]);

export function isRetryableStreetviewError(code: StreetviewErrorCode): boolean {
  return retryableErrorCodes.has(code);
}

export function retryDelayMs(attempt: number): number {
  const base = Number(process.env.STREETVIEW_RETRY_BASE_MS);
  const configuredBase = Number.isFinite(base) && base >= 100 ? base : 5_000;
  const max = Number(process.env.STREETVIEW_RETRY_MAX_MS);
  const configuredMax = Number.isFinite(max) && max >= configuredBase ? max : 5 * 60_000;
  return Math.min(configuredMax, configuredBase * (2 ** Math.max(0, attempt - 1)));
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "");
}

export function classifyStreetviewError(error: unknown): {
  code: StreetviewErrorCode;
  retryable: boolean;
  technicalMessage: string;
} {
  const message = messageOf(error);
  if (message === "INVALID_VIDEO_SIZE" || message === "INVALID_VIDEO_CONTAINER" || message === "UNSUPPORTED_MIME_TYPE") {
    return { code: message, retryable: false, technicalMessage: message };
  }
  if (message === "ENOENT" || /NoSuchKey|NotFound|FILE_NOT_FOUND/i.test(message)) {
    return { code: "FILE_NOT_FOUND", retryable: false, technicalMessage: message };
  }
  if (/timeout|timed out|ECONNRESET|ECONNREFUSED|ENETUNREACH|EAI_AGAIN|ServiceUnavailable|SlowDown/i.test(message)) {
    return { code: "NETWORK_TEMPORARY", retryable: true, technicalMessage: message };
  }
  if (/storage|S3|bucket|object/i.test(message)) {
    return { code: "STORAGE_UNAVAILABLE", retryable: true, technicalMessage: message };
  }
  if (/metadata|duration|resolution|codec|framerate/i.test(message)) {
    return { code: "INVALID_METADATA", retryable: false, technicalMessage: message };
  }
  return { code: "PROCESSING_ERROR", retryable: false, technicalMessage: message || "PROCESSING_ERROR" };
}