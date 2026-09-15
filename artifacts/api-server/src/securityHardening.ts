import { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

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

export const placeExperienceMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop d'actions d'expérience du lieu. Veuillez réessayer plus tard." },
});

export const placeExperienceReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de consultations du contexte des lieux. Veuillez réessayer plus tard." },
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

export const surveillanceAgentEnrollmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de demandes d'enrôlement d'agent. Veuillez réessayer plus tard." },
});

export const surveillanceAgentHeartbeatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de heartbeats d'agent. Veuillez réessayer plus tard." },
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

  // HPP et xss-clean ont été retirés le 15 septembre 2026 suite à une
  // incompatibilité avec router@2.2.0 : ces middlewares réassignaient
  // req.query, devenu en lecture seule, ce qui causait des réponses 500 sur
  // toutes les routes. Leur remplacement par une protection HPP et une
  // sanitization XSS modernes, compatibles avec la version actuelle
  // d'Express, reste un suivi séparé, non couvert par ce correctif.

  // 2. Rate limiting global (activé en production sur /api)
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
