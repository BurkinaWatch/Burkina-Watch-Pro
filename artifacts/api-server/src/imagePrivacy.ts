import sharp from "sharp";

export const MAX_IMAGE_WIDTH = 8_000;
export const MAX_IMAGE_HEIGHT = 8_000;
export const MAX_IMAGE_PIXELS = MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT;
export const DEFAULT_INLINE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export class ImagePrivacyError extends Error {
  readonly code = "IMAGE_PRIVACY_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ImagePrivacyError";
  }
}

type BinaryKind =
  | "jpeg"
  | "png"
  | "webp"
  | "gif"
  | "tiff"
  | "heic-avif"
  | "video"
  | "unknown";

function startsWithBytes(buffer: Buffer, bytes: number[]): boolean {
  return buffer.subarray(0, bytes.length).equals(Buffer.from(bytes));
}

function readAscii(buffer: Buffer, start: number, length: number): string {
  return buffer.subarray(start, start + length).toString("ascii");
}

function detectBinaryKind(buffer: Buffer): BinaryKind {
  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    readAscii(buffer, 0, 4) === "RIFF" &&
    readAscii(buffer, 8, 4) === "WEBP"
  ) {
    return "webp";
  }
  if (readAscii(buffer, 0, 6) === "GIF87a" || readAscii(buffer, 0, 6) === "GIF89a") {
    return "gif";
  }
  if (
    startsWithBytes(buffer, [0x49, 0x49, 0x2a, 0x00]) ||
    startsWithBytes(buffer, [0x4d, 0x4d, 0x00, 0x2a])
  ) {
    return "tiff";
  }

  if (buffer.length >= 12 && readAscii(buffer, 4, 4) === "ftyp") {
    const brand = readAscii(buffer, 8, 4);
    if (["avif", "avis", "heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)) {
      return "heic-avif";
    }
    return "video";
  }

  if (startsWithBytes(buffer, [0x1a, 0x45, 0xdf, 0xa3])) return "video";
  if (buffer.length >= 12 && readAscii(buffer, 0, 4) === "RIFF" && readAscii(buffer, 8, 4) === "AVI ") {
    return "video";
  }
  if (readAscii(buffer, 0, 4) === "OggS") return "video";

  return "unknown";
}

function decodeDataUrl(dataUrl: string): Buffer {
  const match = /^data:[^;]+;base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) {
    throw new ImagePrivacyError("Le média Base64 est invalide.");
  }

  const buffer = Buffer.from(match[1].replace(/\s/g, ""), "base64");
  if (buffer.length === 0) {
    throw new ImagePrivacyError("Le média Base64 est vide.");
  }
  return buffer;
}

function assertSupportedImageKind(kind: BinaryKind): void {
  if (kind === "heic-avif") {
    const formats = sharp.format as unknown as Record<string, { input?: boolean }>;
    if (!formats.heif?.input) {
      throw new ImagePrivacyError(
        "Format HEIC/AVIF non pris en charge sur le serveur. Veuillez exporter la photo en JPEG.",
      );
    }
    return;
  }

  if (!["jpeg", "png", "webp", "gif", "tiff"].includes(kind)) {
    throw new ImagePrivacyError(
      "Le contenu binaire ne correspond pas à une image prise en charge.",
    );
  }
}

async function sanitizeImageBuffer(buffer: Buffer, maxBytes: number): Promise<Buffer> {
  if (buffer.length === 0 || buffer.length > maxBytes) {
    throw new ImagePrivacyError("La photo est vide ou trop volumineuse.");
  }

  const kind = detectBinaryKind(buffer);
  assertSupportedImageKind(kind);

  const image = sharp(buffer, {
    limitInputPixels: MAX_IMAGE_PIXELS,
    failOn: "error",
  });

  let metadata: Awaited<ReturnType<typeof image.metadata>>;
  try {
    metadata = await image.metadata();
  } catch {
    if (kind === "heic-avif") {
      throw new ImagePrivacyError(
        "Format HEIC/AVIF non pris en charge sur le serveur. Veuillez exporter la photo en JPEG.",
      );
    }
    throw new ImagePrivacyError("La photo ne peut pas être décodée.");
  }

  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width > MAX_IMAGE_WIDTH ||
    metadata.height > MAX_IMAGE_HEIGHT
  ) {
    throw new ImagePrivacyError(
      "La résolution de cette image dépasse la limite de 8000 × 8000 pixels.",
    );
  }

  let sanitized: Buffer;
  try {
    sanitized = await image.rotate().jpeg({ quality: 90 }).toBuffer();
  } catch {
    if (kind === "heic-avif") {
      throw new ImagePrivacyError(
        "Format HEIC/AVIF non pris en charge sur le serveur. Veuillez exporter la photo en JPEG.",
      );
    }
    throw new ImagePrivacyError("La photo ne peut pas être réencodée.");
  }

  if (sanitized.length > maxBytes) {
    throw new ImagePrivacyError(
      "La photo réencodée dépasse la taille maximale autorisée.",
    );
  }

  return sanitized;
}

export async function sanitizeImageDataUrlToBuffer(
  dataUrl: string,
  maxBytes: number,
): Promise<Buffer> {
  return sanitizeImageBuffer(decodeDataUrl(dataUrl), maxBytes);
}

export async function sanitizeImageDataUrl(
  dataUrl: string,
  maxBytes: number,
): Promise<string> {
  const sanitized = await sanitizeImageDataUrlToBuffer(dataUrl, maxBytes);
  return `data:image/jpeg;base64,${sanitized.toString("base64")}`;
}

export async function sanitizeOptionalMedia(
  media: string,
  maxBytes: number,
): Promise<string> {
  if (!media.startsWith("data:")) {
    return media;
  }

  const input = decodeDataUrl(media);
  const kind = detectBinaryKind(input);

  if (kind === "video") {
    return media;
  }

  if (
    kind === "jpeg" ||
    kind === "png" ||
    kind === "webp" ||
    kind === "gif" ||
    kind === "tiff" ||
    kind === "heic-avif"
  ) {
    const sanitized = await sanitizeImageBuffer(input, maxBytes);
    return `data:image/jpeg;base64,${sanitized.toString("base64")}`;
  }

  throw new ImagePrivacyError(
    "La signature binaire du média n'est pas reconnue.",
  );
}

export async function sanitizeSignalementMedia<T extends Record<string, unknown>>(
  value: T,
  maxBytes = DEFAULT_INLINE_IMAGE_MAX_BYTES,
): Promise<T> {
  const result: Record<string, unknown> = { ...value };

  if (typeof result.photo === "string") {
    result.photo = await sanitizeOptionalMedia(result.photo, maxBytes);
  }

  if (Array.isArray(result.medias)) {
    result.medias = await Promise.all(
      result.medias.map(async (media) =>
        typeof media === "string"
          ? sanitizeOptionalMedia(media, maxBytes)
          : media,
      ),
    );
  }

  return result as T;
}