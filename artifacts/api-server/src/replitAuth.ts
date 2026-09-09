import crypto from "node:crypto";
import type { Request } from "express";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler, Response, NextFunction } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import {
  getSessionSecret,
  assertProductionSecurityConfiguration,
} from "./securityConfig";
import { requireAuthenticatedUser } from "./authorization";
import { getDatabaseUrl } from "./databaseConfig";

// Désactivé en production Railway pour éviter le crash OIDC
const isProduction = process.env.NODE_ENV === "production" && !process.env.REPL_ID;

export function getSession() {
  assertProductionSecurityConfiguration();
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: getDatabaseUrl(),
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: getSessionSecret(),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || !!process.env.REPL_ID,
      sameSite: process.env.REPL_ID ? "none" : "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(mobileBearerAuthentication);

  passport.serializeUser((user: any, cb) => cb(null, user.id || user.claims?.sub));
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await storage.getUser(id);
      if (!user || !user.id) {
        return cb(null, null);
      }
      // Ne pas restaurer les sessions des utilisateurs anonymes
      // Ils doivent se connecter via OTP pour avoir une vraie session
      if (user.isAnonymous) {
        return cb(null, null);
      }
      // Wrap user with claims.sub for compatibility with routes expecting OIDC-style user
      const wrappedUser = {
        ...user,
        claims: { sub: user.id }
      };
      cb(null, wrappedUser);
    } catch (err) {
      cb(err);
    }
  });

  // Ne plus créer d'utilisateurs anonymes automatiquement
  // Les visiteurs restent des invités non authentifiés
  // Ils doivent se connecter via /connexion pour accéder aux fonctionnalités protégées
}

export const isAuthenticated: RequestHandler = requireAuthenticatedUser;

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MOBILE_ACCESS_TOKEN_TYPE = "mobile-access";

export type MobileTokenUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
  authProvider: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  telephone: string | null;
  bio: string | null;
  ville: string | null;
  metier: string | null;
  role: string | null;
  emailTrackingEnabled: boolean;
  userPoints: number;
  userLevel: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  claims: { sub: string };
};

export type MobileTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: MobileTokenUser;
};

type AccessTokenClaims = {
  sub: string;
  role: string | null;
  typ: typeof MOBILE_ACCESS_TOKEN_TYPE;
  iat: number;
  exp: number;
};

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signAccessToken(header: string, payload: string): string {
  const signingInput = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(signingInput)
    .digest();
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

function toMobileTokenUser(user: any): MobileTokenUser {
  return {
    id: user.id,
    email: user.email ?? null,
    isAnonymous: Boolean(user.isAnonymous),
    authProvider: user.authProvider ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    profileImageUrl: user.profileImageUrl ?? null,
    telephone: user.telephone ?? null,
    bio: user.bio ?? null,
    ville: user.ville ?? null,
    metier: user.metier ?? null,
    role: user.role ?? null,
    emailTrackingEnabled: Boolean(user.emailTrackingEnabled),
    userPoints: user.userPoints ?? 0,
    userLevel: user.userLevel ?? "sentinelle",
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
    claims: { sub: user.id },
  };
}

function hashRefreshToken(token: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(`mobile-refresh:${token}`)
    .digest("hex");
}

function getBearerToken(req: Request): string | null {
  const authorization = req.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

function verifyAccessToken(token: string): AccessTokenClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = signAccessToken(header, payload).split(".")[2];
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsedHeader = JSON.parse(base64UrlDecode(header)) as { alg?: string; typ?: string };
    const claims = JSON.parse(base64UrlDecode(payload)) as Partial<AccessTokenClaims>;
    if (
      parsedHeader.alg !== "HS256" ||
      parsedHeader.typ !== "JWT" ||
      claims.typ !== MOBILE_ACCESS_TOKEN_TYPE ||
      typeof claims.sub !== "string" ||
      typeof claims.iat !== "number" ||
      typeof claims.exp !== "number" ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return claims as AccessTokenClaims;
  } catch {
    return null;
  }
}

function createAccessToken(user: any): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      role: user.role ?? null,
      typ: MOBILE_ACCESS_TOKEN_TYPE,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS,
    } satisfies AccessTokenClaims),
  );
  return signAccessToken(header, payload);
}

export async function issueMobileTokens(
  user: any,
  req: Request,
): Promise<MobileTokenResponse> {
  const refreshToken = crypto.randomBytes(48).toString("base64url");
  await storage.createRefreshToken({
    userId: user.id,
    token: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null,
  });

  return {
    accessToken: createAccessToken(user),
    refreshToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user: toMobileTokenUser(user),
  };
}

export async function rotateMobileTokens(
  refreshToken: string,
  req: Request,
): Promise<MobileTokenResponse | null> {
  const hashedToken = hashRefreshToken(refreshToken);
  const storedToken = await storage.getActiveRefreshToken(hashedToken);
  if (!storedToken) return null;

  const user = await storage.getUser(storedToken.userId);
  if (!user || user.isAnonymous) {
    await storage.revokeRefreshToken(hashedToken);
    return null;
  }

  await storage.revokeRefreshToken(hashedToken);
  return issueMobileTokens(user, req);
}

export async function revokeMobileToken(refreshToken: string): Promise<void> {
  await storage.revokeRefreshToken(hashRefreshToken(refreshToken));
}

async function mobileBearerAuthentication(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = getBearerToken(req);
  if (!token) {
    next();
    return;
  }

  const claims = verifyAccessToken(token);
  if (!claims) {
    req.user = undefined;
    (req as any).isAuthenticated = () => false;
    next();
    return;
  }

  const user = await storage.getUser(claims.sub);
  if (!user || user.isAnonymous) {
    req.user = undefined;
    (req as any).isAuthenticated = () => false;
    next();
    return;
  }

  req.user = { ...user, claims: { sub: user.id } };
  (req as any).isAuthenticated = () => true;
  next();
}
