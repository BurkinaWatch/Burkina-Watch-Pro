import helmet from "helmet";
import rateLimit from "express-rate-limit";
// @ts-ignore - No types available for hpp
import hpp from "hpp";
// @ts-ignore - No types available for xss-clean
import xss from "xss-clean";
import type { Express, Request, Response, NextFunction } from "express";

export function applySecurityMiddlewares(app: Express) {
  // Helmet - Protection headers HTTP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://maps.googleapis.com",
            "https://www.google.com",
            "https://challenges.cloudflare.com",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https:",
            "http:",
            "https://maps.googleapis.com",
            "https://maps.gstatic.com",
          ],
          connectSrc: [
            "'self'",
            "https://maps.googleapis.com",
            "https://api.openai.com",
            "ws:",
            "wss:",
          ],
          frameSrc: ["https://challenges.cloudflare.com", "https://www.google.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: "deny",
      },
      referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
      },
    })
  );

  // XSS Protection
  app.use(xss());

  // HTTP Parameter Pollution Protection
  app.use(hpp());

  // Rate limiting global
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite à 100 requêtes par IP
    message: "Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", generalLimiter);

  // Rate limiting strict pour les endpoints d'authentification
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limite à 5 tentatives de connexion
    skipSuccessfulRequests: true,
    message: "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  // Rate limiting pour le chatbot
  const chatbotLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 15, // Max 15 messages par 5 minutes
    message: "Trop de messages au chatbot. Veuillez patienter quelques minutes.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/chatbot", chatbotLimiter);

  // CORS configuration stricte
  const allowedOrigins = [
    "http://localhost:5000",
    "http://localhost:3000",
    process.env.REPLIT_DOMAINS?.split(",")[0] || "",
    process.env.FRONTEND_URL || "",
  ].filter(Boolean);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  // Limiter la taille des requêtes
  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers["content-length"];
    const maxSize = 20 * 1024 * 1024; // 20MB max

    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        error: "Fichier trop volumineux. Limite: 20MB",
      });
    }

    next();
  });

  console.log("✅ Middlewares de sécurité appliqués");
}

// Middleware de logging pour audit trail
export function auditLogger(action: string, userId: string, details: any = {}) {
  const auditLog = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    details,
    ip: details.ip || "unknown",
  };

  console.log("🔐 AUDIT:", JSON.stringify(auditLog));

  // TODO: Sauvegarder dans la table audit_logs en base de données
  return auditLog;
}

// Middleware pour vérifier les tentatives de connexion
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

export function checkBruteForce(identifier: string): {
  allowed: boolean;
  message?: string;
  remainingLockTime?: number;
} {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, {
      count: 1,
      lastAttempt: now,
    });
    return { allowed: true };
  }

  // Vérifier si le compte est verrouillé
  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    const remainingMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
    return {
      allowed: false,
      message: `Compte temporairement verrouillé. Réessayez dans ${remainingMinutes} minute(s).`,
      remainingLockTime: remainingMinutes,
    };
  }

  // Réinitialiser si plus de 15 minutes depuis la dernière tentative
  if (now - attempt.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(identifier, {
      count: 1,
      lastAttempt: now,
    });
    return { allowed: true };
  }

  // Incrémenter le compteur
  attempt.count++;
  attempt.lastAttempt = now;

  // Verrouiller après 5 tentatives
  if (attempt.count >= 5) {
    attempt.lockedUntil = now + 30 * 60 * 1000; // 30 minutes de verrouillage
    loginAttempts.set(identifier, attempt);
    return {
      allowed: false,
      message: "Trop de tentatives échouées. Compte verrouillé pour 30 minutes.",
      remainingLockTime: 30,
    };
  }

  loginAttempts.set(identifier, attempt);
  return { allowed: true };
}

export function resetBruteForce(identifier: string) {
  loginAttempts.delete(identifier);
}

// Rate limiter pour les mutations de signalements (POST/PATCH/DELETE uniquement)
// À appliquer individuellement aux routes de mutation pour ne pas limiter les GET
export const signalementMutationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // Max 20 mutations par heure
  message: "Limite de publications atteinte. Veuillez réessayer dans une heure.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Nettoyer les anciennes tentatives toutes les heures
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  loginAttempts.forEach((attempt, key) => {
    if (
      now - attempt.lastAttempt > 60 * 60 * 1000 &&
      (!attempt.lockedUntil || attempt.lockedUntil < now)
    ) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => loginAttempts.delete(key));
}, 60 * 60 * 1000);
