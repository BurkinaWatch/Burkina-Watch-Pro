import { createHmac } from "node:crypto";
import { mkdir, writeFile, unlink, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSessionSecret } from "./securityConfig";

const storageRoot = path.resolve(
  process.env.STREETVIEW_STORAGE_DIR || path.join(process.cwd(), "uploads", "streetview"),
);

const DEFAULT_PART_SIZE_BYTES = 8 * 1024 * 1024;
const DEFAULT_SIGNED_URL_TTL_SECONDS = 15 * 60;

type StreetviewStorageProvider = "filesystem" | "s3";

type S3Settings = {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  forcePathStyle: boolean;
  signedUrlTtlSeconds: number;
  multipartPartSizeBytes: number;
};

let s3Client: S3Client | undefined;

function getProvider(): StreetviewStorageProvider {
  const configured = process.env.STREETVIEW_STORAGE_PROVIDER?.trim().toLowerCase();
  if (configured === "s3") return "s3";
  if (configured === "filesystem") return "filesystem";
  return process.env.NODE_ENV === "production" ? "s3" : "filesystem";
}

function getS3Settings(): S3Settings {
  const required = [
    ["STREETVIEW_S3_BUCKET", process.env.STREETVIEW_S3_BUCKET],
    ["STREETVIEW_S3_ACCESS_KEY_ID", process.env.STREETVIEW_S3_ACCESS_KEY_ID],
    ["STREETVIEW_S3_SECRET_ACCESS_KEY", process.env.STREETVIEW_S3_SECRET_ACCESS_KEY],
  ] as const;
  const missing = required.filter(([, value]) => !value?.trim()).map(([name]) => name);
  if (missing.length > 0) {
    throw new Error(`StreetView S3 configuration incomplete: ${missing.join(", ")}`);
  }

  const positiveInteger = (name: string, fallback: number): number => {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
  };

  return {
    bucket: process.env.STREETVIEW_S3_BUCKET!.trim(),
    region: process.env.STREETVIEW_S3_REGION?.trim() || "auto",
    endpoint: process.env.STREETVIEW_S3_ENDPOINT?.trim() || undefined,
    accessKeyId: process.env.STREETVIEW_S3_ACCESS_KEY_ID!.trim(),
    secretAccessKey: process.env.STREETVIEW_S3_SECRET_ACCESS_KEY!.trim(),
    sessionToken: process.env.STREETVIEW_S3_SESSION_TOKEN?.trim() || undefined,
    forcePathStyle: process.env.STREETVIEW_S3_FORCE_PATH_STYLE === "true",
    signedUrlTtlSeconds: positiveInteger(
      "STREETVIEW_S3_SIGNED_URL_TTL_SECONDS",
      DEFAULT_SIGNED_URL_TTL_SECONDS,
    ),
    multipartPartSizeBytes:
      positiveInteger("STREETVIEW_S3_MULTIPART_PART_SIZE_MB", DEFAULT_PART_SIZE_BYTES / (1024 * 1024)) *
      1024 *
      1024,
  };
}

function getS3Client(): { client: S3Client; settings: S3Settings } {
  const settings = getS3Settings();
  if (!s3Client) {
    s3Client = new S3Client({
      region: settings.region,
      endpoint: settings.endpoint,
      forcePathStyle: settings.forcePathStyle,
      credentials: {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
        ...(settings.sessionToken ? { sessionToken: settings.sessionToken } : {}),
      },
    });
  }
  return { client: s3Client, settings };
}

function assertSafeStorageKey(key: string): string {
  const normalized = key.replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.split("/").some((part) => !part || part === "." || part === "..") ||
    normalized.includes("\\")
  ) {
    throw new Error("Invalid StreetView storage key");
  }
  return normalized;
}

function resolveStorageKey(key: string): string {
  const normalized = assertSafeStorageKey(key);
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

export function assertStreetviewStorageConfigured(): void {
  const provider = getProvider();
  if (provider === "s3") {
    getS3Settings();
    return;
  }
  if (process.env.NODE_ENV === "production" && process.env.STREETVIEW_STORAGE_DURABLE !== "true") {
    throw new Error(
      "Le stockage StreetView filesystem est interdit en production sans volume persistant explicite.",
    );
  }
}

export async function writeStreetviewBuffer(key: string, content: Buffer): Promise<void> {
  const normalized = assertSafeStorageKey(key);
  if (getProvider() === "s3") {
    const { client, settings } = getS3Client();
    await client.send(new PutObjectCommand({
      Bucket: settings.bucket,
      Key: normalized,
      Body: content,
      ContentType: content.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
        ? "image/jpeg"
        : undefined,
    }));
    return;
  }

  const filename = resolveStorageKey(normalized);
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
  const normalized = assertSafeStorageKey(key);
  if (getProvider() === "s3") {
    const { client, settings } = getS3Client();
    await client.send(new DeleteObjectCommand({ Bucket: settings.bucket, Key: normalized }));
    return;
  }

  try {
    await unlink(resolveStorageKey(normalized));
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function readStreetviewObject(key: string): Promise<Buffer> {
  const normalized = assertSafeStorageKey(key);
  if (getProvider() === "s3") {
    const { client, settings } = getS3Client();
    const result = await client.send(new GetObjectCommand({ Bucket: settings.bucket, Key: normalized }));
    if (!result.Body) throw new Error("StreetView object has no body");
    return Buffer.from(await result.Body.transformToByteArray());
  }
  return readFile(resolveStorageKey(normalized));
}

export async function readStreetviewObjectRange(
  key: string,
  start: number,
  end: number,
): Promise<Buffer> {
  if (start < 0 || end < start) throw new Error("Invalid StreetView object range");
  const normalized = assertSafeStorageKey(key);
  if (getProvider() === "s3") {
    const { client, settings } = getS3Client();
    const result = await client.send(new GetObjectCommand({
      Bucket: settings.bucket,
      Key: normalized,
      Range: `bytes=${start}-${end}`,
    }));
    if (!result.Body) throw new Error("StreetView object has no body");
    return Buffer.from(await result.Body.transformToByteArray());
  }
  const content = await readFile(resolveStorageKey(normalized));
  return content.subarray(start, end + 1);
}

export async function headStreetviewObject(key: string): Promise<{
  contentLength: number;
  contentType: string | null;
  etag: string | null;
}> {
  const normalized = assertSafeStorageKey(key);
  if (getProvider() === "s3") {
    const { client, settings } = getS3Client();
    const result = await client.send(new HeadObjectCommand({ Bucket: settings.bucket, Key: normalized }));
    return {
      contentLength: result.ContentLength ?? 0,
      contentType: result.ContentType || null,
      etag: result.ETag || null,
    };
  }
  const metadata = await stat(resolveStorageKey(normalized));
  return { contentLength: metadata.size, contentType: null, etag: null };
}

export async function createStreetviewMultipartUpload(
  key: string,
  contentType: string,
): Promise<{ uploadId: string; partSizeBytes: number }> {
  if (getProvider() !== "s3") throw new Error("Multipart uploads require S3 storage");
  const normalized = assertSafeStorageKey(key);
  const { client, settings } = getS3Client();
  const result = await client.send(new CreateMultipartUploadCommand({
    Bucket: settings.bucket,
    Key: normalized,
    ContentType: contentType,
    Metadata: { purpose: "streetview-original" },
  }));
  if (!result.UploadId) throw new Error("S3 did not return a multipart upload id");
  return { uploadId: result.UploadId, partSizeBytes: settings.multipartPartSizeBytes };
}

export async function createStreetviewMultipartPartUrl(
  key: string,
  uploadId: string,
  partNumber: number,
): Promise<string> {
  if (getProvider() !== "s3") throw new Error("Multipart uploads require S3 storage");
  const normalized = assertSafeStorageKey(key);
  const { client, settings } = getS3Client();
  return getSignedUrl(
    client,
    new UploadPartCommand({
      Bucket: settings.bucket,
      Key: normalized,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: settings.signedUrlTtlSeconds },
  );
}

export async function completeStreetviewMultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>,
): Promise<void> {
  if (getProvider() !== "s3") throw new Error("Multipart uploads require S3 storage");
  const normalized = assertSafeStorageKey(key);
  const { client, settings } = getS3Client();
  await client.send(new CompleteMultipartUploadCommand({
    Bucket: settings.bucket,
    Key: normalized,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts
        .sort((a, b) => a.partNumber - b.partNumber)
        .map((part) => ({ PartNumber: part.partNumber, ETag: part.etag })),
    },
  }));
}

export async function abortStreetviewMultipartUpload(
  key: string,
  uploadId: string,
): Promise<void> {
  if (getProvider() !== "s3") return;
  const normalized = assertSafeStorageKey(key);
  const { client, settings } = getS3Client();
  await client.send(new AbortMultipartUploadCommand({
    Bucket: settings.bucket,
    Key: normalized,
    UploadId: uploadId,
  }));
}

export async function createStreetviewDownloadUrl(key: string): Promise<string | null> {
  const normalized = assertSafeStorageKey(key);
  if (getProvider() !== "s3") return null;
  const { client, settings } = getS3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: settings.bucket, Key: normalized }),
    { expiresIn: settings.signedUrlTtlSeconds },
  );
}

export function getStreetviewStorageInfo(): {
  provider: StreetviewStorageProvider;
  root: string;
  durable: boolean;
  uploadMode: "proxy" | "multipart";
} {
  const provider = getProvider();
  return {
    provider,
    root: storageRoot,
    durable: provider === "s3" || process.env.STREETVIEW_STORAGE_DURABLE === "true",
    uploadMode: provider === "s3" ? "multipart" : "proxy",
  };
}

export function getStreetviewMultipartPartSizeBytes(): number {
  return getS3Settings().multipartPartSizeBytes;
}

export function signStreetviewStorageProof(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}