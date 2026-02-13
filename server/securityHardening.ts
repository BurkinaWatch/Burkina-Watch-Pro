declare module 'hpp';
declare module 'xss-clean';

import { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
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

export function applySecurityMiddlewares(app: Express) {
  const isDev = process.env.NODE_ENV !== "production";

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          ...(isDev ? ["'unsafe-eval'"] : []),
          "https://*.openstreetmap.org",
          "https://unpkg.com",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://unpkg.com",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://*.openstreetmap.org",
          "https://nominatim.openstreetmap.org",
          "https://overpass-api.de",
          "https://cdnjs.cloudflare.com",
          ...(isDev ? ["ws:", "wss:"] : []),
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "blob:"],
        frameSrc: ["'self'"],
        frameAncestors: ["'self'", "https://*.replit.dev", "https://*.repl.co"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        upgradeInsecureRequests: isDev ? null : [],
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
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
