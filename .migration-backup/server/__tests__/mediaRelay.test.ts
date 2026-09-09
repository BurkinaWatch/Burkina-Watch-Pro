import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildMediaRelayArgs,
  CameraAgentMediaRelay,
  deriveAgentStreamPath,
} from "../../agent/mediaRelay";

describe("Camera Agent media relay", () => {
  test("derives an opaque deterministic path from agent/camera/stream identity", () => {
    const first = deriveAgentStreamPath("agent-a", "camera-a", "live", "secret");
    const second = deriveAgentStreamPath("agent-a", "camera-a", "live", "secret");
    const other = deriveAgentStreamPath("agent-b", "camera-a", "live", "secret");

    assert.match(first, /^surveillance-[a-f0-9]{32}$/);
    assert.equal(first, second);
    assert.notEqual(first, other);
  });

  test("builds a TCP RTSP pull/publish command without a shell", () => {
    const args = buildMediaRelayArgs(
      "rtsp://127.0.0.1:8554/source",
      "rtsp://agent:password@127.0.0.1:8554/destination",
    );

    assert.deepEqual(args.slice(0, 9), [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-nostdin",
      "-rtsp_transport",
      "tcp",
      "-i",
      "rtsp://127.0.0.1:8554/source",
      "-map",
    ]);
    assert.equal(args.at(-1), "rtsp://agent:password@127.0.0.1:8554/destination");
  });

  test("rejects non-local sources and missing dedicated publisher credentials", () => {
    assert.throws(
      () =>
        new CameraAgentMediaRelay({
          agentId: "agent",
          cameraId: "camera",
          streamId: "live",
          sourceUrl: "rtsp://10.0.0.20:8554/source",
          mediaOrigin: "rtsp://127.0.0.1:8554",
          publisherUsername: "agent",
          publisherPassword: "password",
          pathSecret: "secret",
          testMode: true,
        }),
      /local/,
    );
    assert.throws(
      () =>
        new CameraAgentMediaRelay({
          agentId: "agent",
          cameraId: "camera",
          streamId: "live",
          sourceUrl: "rtsp://127.0.0.1:8554/source",
          mediaOrigin: "rtsp://127.0.0.1:8554",
          publisherUsername: "agent",
          publisherPassword: "",
          pathSecret: "secret",
          testMode: true,
        }),
      /Credential publisher/,
    );
  });
});