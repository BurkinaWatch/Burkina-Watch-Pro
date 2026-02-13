declare module 'hpp';
declare module 'xss-clean';

import { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import xss from "xss-clean";
import crypto from "crypto";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de requêtes, veuillez réessayer plus tard." }
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de tentatives d'authentification. Veuillez réessayer dans une heure." }
});

export const signalementMutationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Limite de publication atteinte. Veuillez patienter avant de publier à nouveau." }
});

export function applySecurityMiddlewares(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";

  app.use((req: Request, res: Response, next: NextFunction) => {
    const nonce = crypto.randomBytes(16).toString("base64");
    (res as any).locals.cspNonce = nonce;
    next();
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const nonce = (res as any).locals.cspNonce;

    if (isProduction) {
      const directives: Record<string, string[]> = {
        "default-src": ["'none'"],
        "script-src": [`'nonce-${nonce}'`, "'strict-dynamic'", "'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "img-src": ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://cdnjs.cloudflare.com", "https://*.openstreetmap.org"],
        "connect-src": ["'self'", "https://*.openstreetmap.org", "https://nominatim.openstreetmap.org", "https://overpass-api.de", "wss:", "ws:"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "object-src": ["'none'"],
        "media-src": ["'self'", "blob:"],
        "frame-src": ["'none'"],
        "frame-ancestors": ["'self'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "worker-src": ["'self'", "blob:"],
        "manifest-src": ["'self'"],
        "child-src": ["'self'", "blob:"],
        "upgrade-insecure-requests": [],
      };

      const cspString = Object.entries(directives)
        .map(([key, values]) => values.length > 0 ? `${key} ${values.join(" ")}` : key)
        .join("; ");

      res.setHeader("Content-Security-Policy", cspString);
    } else {
      const directives: Record<string, string[]> = {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
        "connect-src": ["'self'", "https:", "wss:", "ws:", "http:"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "object-src": ["'none'"],
        "media-src": ["'self'", "blob:"],
        "frame-src": ["'self'"],
        "frame-ancestors": ["'self'", "https://*.replit.dev", "https://*.repl.co"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "worker-src": ["'self'", "blob:"],
        "manifest-src": ["'self'"],
        "child-src": ["'self'", "blob:"],
      };

      const cspString = Object.entries(directives)
        .map(([key, values]) => `${key} ${values.join(" ")}`)
        .join("; ");

      res.setHeader("Content-Security-Policy", cspString);
    }

    next();
  });

  app.use(helmet({
    contentSecurityPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xContentTypeOptions: true,
    xFrameOptions: false,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  }));

  app.use(hpp());

  app.use(xss());

  app.use("/api", globalLimiter);

  app.set("trust proxy", 1);

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=(self), payment=()");
    next();
  });
}
