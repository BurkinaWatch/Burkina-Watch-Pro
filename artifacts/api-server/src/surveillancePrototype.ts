import crypto from "node:crypto";

export const SURVEILLANCE_TEST_CAMERA_ID_PREFIX = "phase5-local-test-camera";
export const SURVEILLANCE_TEST_PATH_PREFIX = "phase5-";
const configuredTestPathName =
  process.env.SURVEILLANCE_TEST_PATH_NAME?.trim() || "phase5-test";
if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(configuredTestPathName)) {
  throw new Error("SURVEILLANCE_TEST_PATH_NAME invalide");
}
export const SURVEILLANCE_TEST_PATH_NAME = configuredTestPathName;
export const SURVEILLANCE_AGENT_TEST_SOURCE_PATH_NAME = "phase8-2-source";
export const SURVEILLANCE_REAL_PATH_PREFIX = "surveillance-";
export const SURVEILLANCE_TEST_CAMERA_NAME = "TEST — CAMÉRA DE DÉVELOPPEMENT";
export const SURVEILLANCE_TEST_SOURCE_URL =
  "rtsp://127.0.0.1:8554/phase5-test";

export interface SurveillanceTestCamera {
  id: string;
  name: string;
  description: string;
  connectionType: "rtsp";
  host: "local-test-source";
  port: 8554;
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
    port: 8554,
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

export function isSurveillanceGatewayPathName(pathName: string): boolean {
  return (
    pathName === SURVEILLANCE_TEST_PATH_NAME ||
    pathName.startsWith(SURVEILLANCE_REAL_PATH_PREFIX)
  );
}