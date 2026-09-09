import crypto from "node:crypto";
import net from "node:net";

export type RtspProbeStatus = "online" | "offline" | "error";

export interface RtspProbeResult {
  success: boolean;
  status: RtspProbeStatus;
}

interface RtspProbeOptions {
  host: string;
  port: number;
  streamPath: string | null;
  username: string | null;
  password: string;
  timeoutMs?: number;
}

interface RtspResponse {
  statusCode: number;
  headers: Record<string, string>;
}

function formatHost(host: string): string {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

function buildRtspUrl(options: RtspProbeOptions): string {
  const path = options.streamPath || "/";
  return `rtsp://${formatHost(options.host)}:${options.port}${path}`;
}

function parseResponse(buffer: string): RtspResponse | null {
  const [headerBlock] = buffer.split("\r\n\r\n", 1);
  const lines = headerBlock.split("\r\n");
  const statusMatch = /^RTSP\/\d(?:\.\d)?\s+(\d{3})\b/i.exec(lines[0] || "");
  if (!statusMatch) return null;

  const headers: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    headers[line.slice(0, separator).trim().toLowerCase()] = line
      .slice(separator + 1)
      .trim();
  }
  return { statusCode: Number(statusMatch[1]), headers };
}

function parseAuthParameters(value: string): Record<string, string> {
  const parameters: Record<string, string> = {};
  const parameterPattern = /([a-z]+)=("(?:[^"\\]|\\.)*"|[^,\s]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = parameterPattern.exec(value)) !== null) {
    parameters[match[1].toLowerCase()] = match[2].replace(/^"|"$/g, "");
  }
  return parameters;
}

function createDigestAuthorization(
  challenge: string,
  username: string,
  password: string,
  method: string,
  uri: string,
): string | null {
  const digestPrefix = /^Digest\s+/i;
  if (!digestPrefix.test(challenge)) return null;
  const params = parseAuthParameters(challenge.replace(digestPrefix, ""));
  if (!params.realm || !params.nonce) return null;

  const hash = (value: string) =>
    crypto.createHash("md5").update(value).digest("hex");
  const cnonce = crypto.randomBytes(16).toString("hex");
  const ha1 = hash(`${username}:${params.realm}:${password}`);
  const ha2 = hash(`${method}:${uri}`);
  const qop = params.qop?.split(",").map((item) => item.trim()).includes("auth")
    ? "auth"
    : null;
  const nonceCount = "00000001";
  const response = qop
    ? hash(`${ha1}:${params.nonce}:${nonceCount}:${cnonce}:${qop}:${ha2}`)
    : hash(`${ha1}:${params.nonce}:${ha2}`);

  const fields = [
    `username="${username}"`,
    `realm="${params.realm}"`,
    `nonce="${params.nonce}"`,
    `uri="${uri}"`,
    `response="${response}"`,
    qop ? `qop=${qop}` : "",
    qop ? `nc=${nonceCount}` : "",
    qop ? `cnonce="${cnonce}"` : "",
    params.opaque ? `opaque="${params.opaque}"` : "",
  ].filter(Boolean);
  return `Digest ${fields.join(", ")}`;
}

function requestRtsp(
  options: RtspProbeOptions,
  uri: string,
  authorization: string | null,
): Promise<RtspResponse | null> {
  const timeoutMs = options.timeoutMs ?? 5000;
  return new Promise((resolve) => {
    const socket = net.createConnection({
      host: options.host,
      port: options.port,
    });
    let settled = false;
    let responseBuffer = "";

    const finish = (response: RtspResponse | null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(response);
    };

    socket.setTimeout(timeoutMs, () => finish(null));
    socket.once("error", () => finish(null));
    socket.once("connect", () => {
      const headers = [
        `DESCRIBE ${uri} RTSP/1.0`,
        "CSeq: 1",
        "Accept: application/sdp",
        "User-Agent: BurkinaWatch-Control-Plane",
      ];
      if (authorization) headers.push(`Authorization: ${authorization}`);
      socket.write(`${headers.join("\r\n")}\r\n\r\n`);
    });
    socket.on("data", (chunk: Buffer) => {
      responseBuffer += chunk.toString("latin1");
      if (
        responseBuffer.includes("\r\n\r\n") ||
        responseBuffer.length > 32 * 1024
      ) {
        finish(parseResponse(responseBuffer));
      }
    });
    socket.once("end", () => finish(parseResponse(responseBuffer)));
  });
}

export async function probeRtspConnection(
  options: RtspProbeOptions,
): Promise<RtspProbeResult> {
  const uri = buildRtspUrl(options);
  let response = await requestRtsp(options, uri, null);

  if (response?.statusCode === 401 && options.username) {
    const challenge = response.headers["www-authenticate"];
    const authorization = challenge?.startsWith("Basic")
      ? `Basic ${Buffer.from(`${options.username}:${options.password}`).toString("base64")}`
      : challenge
        ? createDigestAuthorization(
            challenge,
            options.username,
            options.password,
            "DESCRIBE",
            uri,
          )
        : null;
    if (authorization) {
      response = await requestRtsp(options, uri, authorization);
    }
  }

  if (response?.statusCode === 200) {
    return { success: true, status: "online" };
  }
  if (response) {
    return { success: false, status: "offline" };
  }
  return { success: false, status: "error" };
}