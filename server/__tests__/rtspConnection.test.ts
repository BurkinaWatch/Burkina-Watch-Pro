import assert from "node:assert/strict";
import net from "node:net";
import { afterEach, describe, test } from "node:test";

import { probeRtspConnection } from "../rtspConnection";

const servers: net.Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
});

function startRtspServer(
  handler: (request: string, connectionNumber: number) => string,
): Promise<{ port: number }> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    let connectionNumber = 0;
    server.on("connection", (socket) => {
      const currentConnection = ++connectionNumber;
      let request = "";
      socket.on("data", (chunk) => {
        request += chunk.toString();
        if (!request.includes("\r\n\r\n")) return;
        socket.end(handler(request, currentConnection));
      });
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      servers.push(server);
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("RTSP test server did not expose a port"));
        return;
      }
      resolve({ port: address.port });
    });
  });
}

describe("RTSP connectivity probe", () => {
  test("confirms a reachable RTSP endpoint without returning protocol data", async () => {
    const { port } = await startRtspServer(
      () =>
        "RTSP/1.0 200 OK\r\nCSeq: 1\r\nContent-Length: 0\r\n\r\n",
    );
    const result = await probeRtspConnection({
      host: "127.0.0.1",
      port,
      streamPath: "/live",
      username: null,
      password: "never-returned",
      timeoutMs: 1000,
    });
    assert.deepEqual(result, { success: true, status: "online" });
    assert.equal(JSON.stringify(result).includes("never-returned"), false);
  });

  test("supports a Basic-authenticated RTSP endpoint", async () => {
    const { port } = await startRtspServer((request, connectionNumber) => {
      if (connectionNumber === 1) {
        return [
          "RTSP/1.0 401 Unauthorized",
          "CSeq: 1",
          'WWW-Authenticate: Basic realm="camera"',
          "Content-Length: 0",
          "",
          "",
        ].join("\r\n");
      }
      assert.match(request, /Authorization: Basic /);
      return "RTSP/1.0 200 OK\r\nCSeq: 1\r\nContent-Length: 0\r\n\r\n";
    });
    const result = await probeRtspConnection({
      host: "127.0.0.1",
      port,
      streamPath: "/stream",
      username: "camera-user",
      password: "camera-password",
      timeoutMs: 1000,
    });
    assert.deepEqual(result, { success: true, status: "online" });
  });

  test("returns an abstract offline result for an unreachable endpoint", async () => {
    const result = await probeRtspConnection({
      host: "127.0.0.1",
      port: 1,
      streamPath: "/",
      username: null,
      password: "hidden",
      timeoutMs: 200,
    });
    assert.deepEqual(result, { success: false, status: "error" });
  });
});