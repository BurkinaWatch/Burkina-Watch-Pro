import { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// @ts-ignore - no type declarations available
import hpp from "hpp";
// @ts-ignore - no type declarations available
import xss from "xss-clean";

// Rate limiting global
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de requêtes, veuillez réessayer plus tard." }
});

// Rate limiting spécifique pour l'authentification (OTP)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // Max 10 tentatives par heure
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de tentatives d'authentification. Veuillez réessayer dans une heure." }
});

// Rate limiting pour la création de signalements
export const signalementMutationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5, // Limite à 5 signalements par heure par utilisateur/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Limite de publication atteinte. Veuillez patienter avant de publier à nouveau." }
});

// Rate limiting for camera management mutations. This is intentionally
// separate from the global limiter because camera setup can trigger expensive
// validation/encryption work even though no network connection is made here.
export const surveillanceMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de modifications de caméra. Veuillez réessayer plus tard." },
});

export const surveillanceConnectionTestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de tests de connexion. Veuillez réessayer plus tard." },
});

function getConfiguredMediaGatewayOrigins(): string[] {
  return (process.env.MEDIA_GATEWAY_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .flatMap((origin) => {
      try {
        const parsed = new URL(origin);
        if (!["https:", "wss:"].includes(parsed.protocol) || parsed.pathname !== "/" || parsed.search || parsed.hash) {
          return [];
        }
        return [parsed.origin];
      } catch {
        return [];
      }
    });
}

export function applySecurityMiddlewares(app: Express) {
  const mediaGatewayOrigins = getConfiguredMediaGatewayOrigins();
  const mediaOrigins = mediaGatewayOrigins.filter((origin) => origin.startsWith("https://"));

  // 1. Protection des headers HTTP avec Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.openstreetmap.org", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://*.openstreetmap.org",
          "https://nominatim.openstreetmap.org",
          ...mediaGatewayOrigins,
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", ...mediaOrigins],
        frameSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 an en secondes
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: false,
  }));

  // 2. Protection contre la pollution des paramètres HTTP (HPP)
  app.use(hpp());

  // 3. Nettoyage basique des entrées XSS
  app.use(xss());

  // 4. Rate limiting global (activé en production sur /api)
  if (process.env.NODE_ENV === "production") {
    app.use("/api", globalLimiter);
  } else {
    // En développement, on applique quand même la limite demandée (100 req / 15 min) 
    // mais on s'assure de ne pas bloquer les routes de développement
    app.use("/api", globalLimiter);
  }

  // 5. Sécurisation des cookies et confiance proxy
  app.set("trust proxy", 1); 
}
