import { CameraAgentMediaRelay } from "./mediaRelay";

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} est obligatoire`);
  return value;
};

const relay = new CameraAgentMediaRelay({
  agentId: required("BURKINAWATCH_AGENT_ID"),
  cameraId: required("BURKINAWATCH_CAMERA_ID"),
  streamId: process.env.BURKINAWATCH_STREAM_ID?.trim() || "live",
  sourceUrl:
    process.env.BURKINAWATCH_LOCAL_RTSP_URL ||
    "rtsp://127.0.0.1:8554/phase8-2-source",
  mediaOrigin:
    process.env.BURKINAWATCH_MEDIA_RTSP_ORIGIN ||
    "rtsp://127.0.0.1:8554",
  publisherUsername: required("VIDEO_GATEWAY_PUBLISHER_USERNAME"),
  publisherPassword: required("VIDEO_GATEWAY_PUBLISHER_PASSWORD"),
  pathSecret: required("VIDEO_GATEWAY_PATH_SECRET"),
  testMode: true,
  onStatus: (status) => console.log(`[AGENT_MEDIA] status=${status}`),
});

relay.start();
process.once("SIGINT", () => relay.stop());
process.once("SIGTERM", () => relay.stop());