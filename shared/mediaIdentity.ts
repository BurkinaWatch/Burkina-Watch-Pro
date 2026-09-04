import crypto from "node:crypto";

const STREAM_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;

export function assertStreamId(streamId: string): string {
  if (!STREAM_ID_PATTERN.test(streamId)) {
    throw new Error("streamId invalide");
  }
  return streamId;
}

export function deriveOpaqueStreamPath(
  agentId: string,
  cameraId: string,
  streamId: string,
  pathSecret: string,
): string {
  assertStreamId(streamId);
  const digest = crypto
    .createHmac("sha256", pathSecret)
    .update(`${agentId}:${cameraId}:${streamId}`)
    .digest("hex")
    .slice(0, 32);
  return `surveillance-${digest}`;
}