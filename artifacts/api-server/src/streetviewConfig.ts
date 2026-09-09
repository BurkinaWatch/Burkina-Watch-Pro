const numberFromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const streetviewConfig = {
  maxVideoBytes: numberFromEnv("STREETVIEW_MAX_VIDEO_MB", 100) * 1024 * 1024,
  minDurationSeconds: numberFromEnv("STREETVIEW_MIN_DURATION_SECONDS", 2),
  maxDurationSeconds: numberFromEnv("STREETVIEW_MAX_DURATION_SECONDS", 180),
  thumbnailMaxBytes: numberFromEnv("STREETVIEW_MAX_THUMBNAIL_KB", 512) * 1024,
  allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"] as const,
};

export type StreetviewConfig = typeof streetviewConfig;