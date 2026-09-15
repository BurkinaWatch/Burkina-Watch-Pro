import assert from "node:assert/strict";
import net from "node:net";
import test from "node:test";

import {
  sendEmergencyTrackingSignalLostEmail,
  sendEmergencyTrackingStartEmail,
  sendLocationEmail,
  sendOtpEmail,
} from "./emailService";

type CapturedMessage = {
  from: string;
  to: string;
  raw: string;
};

class LocalSmtpServer {
  private readonly server = net.createServer((socket) => {
    let input = "";
    let dataMode = false;
    let messageData = "";
    let authStep: "username" | "password" | null = null;
    let from = "";
    let to = "";

    socket.setEncoding("utf8");
    socket.write("220 localhost ESMTP ready\r\n");

    const processInput = () => {
      while (true) {
        if (dataMode) {
          const terminatorIndex = input.indexOf("\r\n.\r\n");
          if (terminatorIndex < 0) return;

          messageData += input.slice(0, terminatorIndex);
          input = input.slice(terminatorIndex + "\r\n.\r\n".length);
          dataMode = false;
          this.messages.push({ from, to, raw: messageData });
          messageData = "";
          socket.write("250 2.0.0 message accepted\r\n");
          continue;
        }

        const lineEnd = input.indexOf("\r\n");
        if (lineEnd < 0) return;

        const line = input.slice(0, lineEnd);
        input = input.slice(lineEnd + 2);
        const command = line.toUpperCase();

        if (authStep) {
          if (authStep === "username") {
            authStep = "password";
            socket.write("334 UGFzc3dvcmQ6\r\n");
          } else {
            authStep = null;
            socket.write("235 2.7.0 authentication successful\r\n");
          }
        } else if (command.startsWith("EHLO") || command.startsWith("HELO")) {
          socket.write("250-localhost\r\n250-AUTH PLAIN LOGIN\r\n250 SIZE 10485760\r\n");
        } else if (command.startsWith("AUTH PLAIN")) {
          if (line.trim().split(/\s+/).length === 2) {
            authStep = "password";
            socket.write("334 \r\n");
          } else {
            socket.write("235 2.7.0 authentication successful\r\n");
          }
        } else if (command.startsWith("AUTH LOGIN")) {
          authStep = "username";
          socket.write("334 VXNlcm5hbWU6\r\n");
        } else if (command.startsWith("MAIL FROM:")) {
          from = line.slice(line.indexOf(":") + 1).trim();
          socket.write("250 2.1.0 sender ok\r\n");
        } else if (command.startsWith("RCPT TO:")) {
          to = line.slice(line.indexOf(":") + 1).trim();
          socket.write("250 2.1.5 recipient ok\r\n");
        } else if (command === "DATA") {
          dataMode = true;
          socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
        } else if (command === "RSET") {
          from = "";
          to = "";
          socket.write("250 2.0.0 reset\r\n");
        } else if (command === "QUIT") {
          socket.write("221 2.0.0 closing connection\r\n");
          socket.end();
        } else {
          socket.write("250 2.0.0 ok\r\n");
        }
      }
    };

    socket.on("data", (chunk) => {
      input += chunk;
      processInput();
    });
  });

  readonly messages: CapturedMessage[] = [];

  async start(): Promise<number> {
    await new Promise<void>((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = this.server.address();
    assert(address && typeof address !== "string");
    return address.port;
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function withTestSmtpEnvironment(port: number): () => void {
  const keys = [
    "RESEND_API_KEY",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM_EMAIL",
    "SMTP_FROM_NAME",
  ] as const;
  const previous = new Map<string, string | undefined>(
    keys.map((key) => [key, process.env[key]]),
  );

  delete process.env.RESEND_API_KEY;
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(port);
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_USER = "smtp-test-user";
  process.env.SMTP_PASS = "smtp-test-pass";
  process.env.SMTP_FROM_EMAIL = "sender@example.test";
  process.env.SMTP_FROM_NAME = "Burkina Watch SMTP Test";

  return () => {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

function messageHeaders(raw: string): string {
  const headerEnd = raw.indexOf("\r\n\r\n");
  assert(headerEnd >= 0, "MIME message must contain headers");
  return raw.slice(0, headerEnd);
}

function messageBody(raw: string): string {
  const headerEnd = raw.indexOf("\r\n\r\n");
  assert(headerEnd >= 0, "MIME message must contain headers");
  return raw.slice(headerEnd + 4);
}

function extractAttachment(raw: string, filename: string): string {
  const headers = messageHeaders(raw);
  const boundary = headers.match(/boundary="?([^";\r\n"]+)/i)?.[1];
  assert(boundary, "multipart message must contain a boundary");

  const part = raw
    .split(`--${boundary}`)
    .find((candidate) => candidate.includes(`filename="${filename}"`));
  assert(part, `attachment ${filename} must be present`);

  const partHeaderEnd = part.indexOf("\r\n\r\n");
  assert(partHeaderEnd >= 0, "attachment part must contain headers");
  const partHeaders = part.slice(0, partHeaderEnd);
  const encoded = part
    .slice(partHeaderEnd + 4)
    .replace(/\r\n--$/, "")
    .trim();

  if (/content-transfer-encoding:\s*base64/i.test(partHeaders)) {
    return Buffer.from(encoded.replace(/\s/g, ""), "base64").toString("utf8");
  }

  return encoded;
}

test("all SMTP email flows work with Nodemailer and keep the GPX content attachment", async () => {
  const smtp = new LocalSmtpServer();
  const port = await smtp.start();
  const restoreEnvironment = withTestSmtpEnvironment(port);

  try {
    const otp = await sendOtpEmail("otp-recipient@example.test", "123456");
    assert.deepEqual(otp, { success: true, message: "Email envoyé" });

    const trackingStart = await sendEmergencyTrackingStartEmail(
      "start-recipient@example.test",
      "Contact Test",
      "Utilisateur Test",
      "https://burkinawatch.com/tracking/test-session",
      { latitude: 12.345678, longitude: -1.234567, address: "Ouagadougou" },
    );
    assert.match(trackingStart.messageId, /.+/);

    const gpx = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<gpx><trk><name>test-session</name></trk></gpx>",
    ].join("\n");
    const trackingStop = await sendLocationEmail(
      "stop-recipient@example.test",
      "Utilisateur Test",
      "Ouagadougou",
      3,
      gpx,
      "test-session",
    );
    assert.match(trackingStop.messageId, /.+/);

    const signalLost = await sendEmergencyTrackingSignalLostEmail(
      "lost-recipient@example.test",
      "Contact Test",
      "Utilisateur Test",
      "https://burkinawatch.com/tracking/test-session",
      {
        latitude: "12.345678",
        longitude: "-1.234567",
        timestamp: new Date("2026-01-01T12:00:00.000Z"),
      },
    );
    assert.match(signalLost.messageId, /.+/);

    assert.equal(smtp.messages.length, 4);
    assert.match(smtp.messages[0].raw, /Votre code de connexion Burkina Watch/);
    assert.match(smtp.messages[0].raw, /123456/);
    assert.match(smtp.messages[1].raw, /a activé le suivi de sécurité en direct/);
    assert.match(smtp.messages[1].raw, /12\.345678/);
    assert.match(smtp.messages[3].raw, /signal de Utilisateur Test perdu/);
    assert.match(smtp.messages[3].raw, /12\.345678/);

    const expectedFilename = "burkina-watch-tracking-test-session.gpx";
    assert.match(smtp.messages[2].raw, new RegExp(`filename="${expectedFilename}"`));
    assert.equal(extractAttachment(smtp.messages[2].raw, expectedFilename), gpx);
    assert.doesNotMatch(smtp.messages[2].raw, /filename="raw"|filename="path"/i);
  } finally {
    restoreEnvironment();
    await smtp.close();
  }
});