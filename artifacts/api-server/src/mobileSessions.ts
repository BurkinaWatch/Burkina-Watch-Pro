import type { RequestHandler } from "express";
import { getAuthenticatedUserId } from "./authorization";

export type MobileSessionRecord = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent: string | null;
  revokedAt?: Date | null;
};

export type MobileSessionStore = {
  getActiveMobileSessions(userId: string): Promise<MobileSessionRecord[]>;
};

function getBrowser(userAgent: string | null): string {
  const normalizedUserAgent = (userAgent ?? "").toLowerCase();

  if (normalizedUserAgent.includes("edg/")) return "Microsoft Edge";
  if (normalizedUserAgent.includes("samsungbrowser")) return "Samsung Internet";
  if (normalizedUserAgent.includes("opr/")) return "Opera";
  if (normalizedUserAgent.includes("firefox")) return "Firefox";
  if (
    normalizedUserAgent.includes("chrome") ||
    normalizedUserAgent.includes("crios")
  ) {
    return "Chrome";
  }
  if (normalizedUserAgent.includes("safari")) return "Safari";
  if (
    normalizedUserAgent.includes("okhttp") ||
    normalizedUserAgent.includes("expo")
  ) {
    return "Application mobile";
  }
  return "Navigateur inconnu";
}

function getDevice(userAgent: string | null): string {
  const normalizedUserAgent = (userAgent ?? "").toLowerCase();

  if (normalizedUserAgent.includes("ipad")) return "iPad";
  if (normalizedUserAgent.includes("iphone")) return "iPhone";
  if (normalizedUserAgent.includes("android")) return "Android";
  if (normalizedUserAgent.includes("mobile")) return "Appareil mobile";
  return "Ordinateur";
}

export function toMobileSessionResponse(session: MobileSessionRecord) {
  return {
    id: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    device: getDevice(session.userAgent),
    browser: getBrowser(session.userAgent),
  };
}

export function getPublicActiveMobileSessions(
  sessions: MobileSessionRecord[],
  now = new Date(),
) {
  return sessions
    .filter(
      (session) =>
        session.revokedAt == null && session.expiresAt.getTime() > now.getTime(),
    )
    .map(toMobileSessionResponse);
}

export function createMobileSessionsHandler(
  sessionStore: MobileSessionStore,
): RequestHandler {
  return async (req: any, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise",
      });
    }

    try {
      const sessions = await sessionStore.getActiveMobileSessions(userId);
      return res.json({
        sessions: getPublicActiveMobileSessions(sessions),
      });
    } catch (error) {
      req.log?.error(error, "Mobile session listing error");
      return res.status(500).json({
        success: false,
        message: "Impossible de récupérer les sessions mobiles",
      });
    }
  };
}