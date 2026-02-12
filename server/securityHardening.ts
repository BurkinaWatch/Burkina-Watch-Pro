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
  // 1. Protection des headers HTTP avec Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*.openstreetmap.org", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://*.openstreetmap.org", "https://nominatim.openstreetmap.org"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // 2. Protection contre la pollution des paramètres HTTP (HPP)
  app.use(hpp());

  // 3. Nettoyage basique des entrées XSS
  // Note: xss-clean est un middleware simple, mais Zod est notre défense principale
  app.use(xss());

  // 4. Rate limiting global (sauf en développement pour éviter les blocages pendant les tests)
  if (process.env.NODE_ENV === "production") {
    app.use("/api", globalLimiter);
  }

  // 5. Sécurisation des cookies (si session présente)
  app.set("trust proxy", 1); // Nécessaire pour Replit (proxy inverse)
}
