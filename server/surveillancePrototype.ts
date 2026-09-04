import crypto from "node:crypto";

export const SURVEILLANCE_TEST_CAMERA_ID_PREFIX = "phase5-local-test-camera";
export const SURVEILLANCE_TEST_PATH_PREFIX = "phase5-";
export const SURVEILLANCE_TEST_CAMERA_NAME = "TEST — CAMÉRA DE DÉVELOPPEMENT";
export const SURVEILLANCE_TEST_SOURCE_URL =
  "rtsp://host.docker.internal:8555/phase5-test";

export interface SurveillanceTestCamera {
  id: string;
  name: string;
  description: string;
  connectionType: "rtsp";
  host: "local-test-source";
  port: 8555;
  streamPath: "/phase5-test";
  status: "unknown";
  isTest: true;
}

function testCameraIdForUser(userId: string): string {
  const userDigest = crypto
    .createHash("sha256")
    .update(userId)
    .digest("hex")
    .slice(0, 24);
  return `${SURVEILLANCE_TEST_CAMERA_ID_PREFIX}-${userDigest}`;
}

export function getSurveillanceTestCamera(
  userId: string,
): SurveillanceTestCamera {
  return {
    id: testCameraIdForUser(userId),
    name: SURVEILLANCE_TEST_CAMERA_NAME,
    description:
      "Flux synthétique local Phase 5. Cette caméra n'est pas une caméra de production.",
    connectionType: "rtsp",
    host: "local-test-source",
    port: 8555,
    streamPath: "/phase5-test",
    status: "unknown",
    isTest: true,
  };
}

export function isSurveillanceTestCameraForUser(
  cameraId: string,
  userId: string,
): boolean {
  return cameraId === getSurveillanceTestCamera(userId).id;
}

export function isSurveillanceTestCameraId(cameraId: string): boolean {
  return cameraId.startsWith(`${SURVEILLANCE_TEST_CAMERA_ID_PREFIX}-`);
}

export function isSurveillanceTestPathName(pathName: string): boolean {
  return pathName.startsWith(SURVEILLANCE_TEST_PATH_PREFIX);
}