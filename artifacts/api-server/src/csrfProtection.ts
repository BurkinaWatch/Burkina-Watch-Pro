import crypto from "node:crypto";
import type { Request, RequestHandler, Response } from "express";
import { getSessionSecret } from "./securityConfig";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function sessionBinding(req: Request): string {
  return (req as Request & { sessionID?: string }).sessionID || "anonymous";
}

function signNonce(nonce: string, binding: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(`${nonce}:${binding}`)
    .digest("hex");
}

export function createCsrfToken(req: Request): string {
  const nonce = crypto.randomBytes(32).toString("hex");
  return `${nonce}.${signNonce(nonce, sessionBinding(req))}`;
}

export function isValidCsrfToken(req: Request, token: string | undefined): boolean {
  if (!token) return false;

  const [nonce, signature] = token.split(".");
  if (
    !nonce ||
    !signature ||
    signature.length !== 64 ||
    nonce.length !== 64 ||
    !/^[0-9a-f]+$/i.test(nonce) ||
    !/^[0-9a-f]{64}$/i.test(signature)
  ) {
    return false;
  }

  const expected = signNonce(nonce, sessionBinding(req));
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  );
}

function readCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.get("cookie");
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key !== name) continue;
    const value = valueParts.join("=");
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return undefined;
}

function isSameOrigin(req: Request): boolean {
  const origin = req.get("origin");
  const referer = req.get("referer");
  const candidate = origin || referer;
  if (!candidate || candidate === "null") return false;

  try {
    const candidateUrl = new URL(candidate);
    const expectedOrigin = `${req.protocol}://${req.get("host")}`;
    return candidateUrl.origin === expectedOrigin;
  } catch {
    return false;
  }
}

export function issueCsrfToken(req: Request, res: Response): void {
  const token = createCsrfToken(req);
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.REPL_ID);
  const sameSite = process.env.REPL_ID ? "None" : "Lax";
  res.setHeader(
    "Set-Cookie",
    `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=${sameSite}${secure ? "; Secure" : ""}`,
  );
  res.json({ csrfToken: token });
}

export const csrfProtection: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const authenticated =
    typeof req.isAuthenticated === "function" && req.isAuthenticated();
  if (!authenticated) return next();

  if (isSameOrigin(req)) return next();

  const headerToken = req.get(CSRF_HEADER_NAME);
  const cookieToken = readCookie(req, CSRF_COOKIE_NAME);
  if (
    headerToken &&
    cookieToken &&
    headerToken === cookieToken &&
    isValidCsrfToken(req, headerToken)
  ) {
    return next();
  }

  return res.status(403).json({
    message: "Protection CSRF requise",
  });
};