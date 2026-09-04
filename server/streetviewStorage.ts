import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const storageRoot = path.resolve(
  process.env.STREETVIEW_STORAGE_DIR || path.join(process.cwd(), "uploads", "streetview"),
);

function resolveStorageKey(key: string): string {
  const normalized = key.replace(/^\/+/, "");
  const resolved = path.resolve(storageRoot, normalized);
  if (resolved !== storageRoot && !resolved.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Invalid StreetView storage key");
  }
  return resolved;
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "video/webm") return "webm";
  if (mimeType === "video/quicktime") return "mov";
  return "mp4";
}

export function streetviewStorageKey(
  contributionId: string,
  mimeType: string,
): string {
  return `contributions/${contributionId}/source/original.${extensionForMimeType(mimeType)}`;
}

export function streetviewThumbnailKey(contributionId: string): string {
  return `contributions/${contributionId}/thumbnail.jpg`;
}

export async function writeStreetviewBuffer(key: string, content: Buffer): Promise<void> {
  const filename = resolveStorageKey(key);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, content, { flag: "w" });
}

export async function writeStreetviewDataUrl(
  key: string,
  dataUrl: string,
  maxBytes: number,
): Promise<number> {
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid image data");
  }

  const buffer = Buffer.from(match[1].replace(/\s/g, ""), "base64");
  if (buffer.length > maxBytes) {
    throw new Error("Thumbnail too large");
  }
  if (buffer.length < 3 || buffer.subarray(0, 3).compare(Buffer.from([0xff, 0xd8, 0xff])) !== 0) {
    throw new Error("Invalid JPEG thumbnail");
  }

  await writeStreetviewBuffer(key, buffer);
  return buffer.length;
}

export async function deleteStreetviewObject(key: string): Promise<void> {
  try {
    await unlink(resolveStorageKey(key));
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export function getStreetviewStorageInfo(): {
  provider: "filesystem";
  root: string;
  durable: boolean;
} {
  return {
    provider: "filesystem",
    root: storageRoot,
    // Railway local disks are not a durable object store unless a persistent
    // volume is explicitly mounted. This adapter is intentionally transparent.
    durable: Boolean(process.env.STREETVIEW_STORAGE_DURABLE === "true"),
  };
}