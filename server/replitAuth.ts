import crypto from "node:crypto";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Désactivé en production Railway pour éviter le crash OIDC
const isProduction = process.env.NODE_ENV === "production" && !process.env.REPL_ID;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "default_secret_for_dev_only",
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

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
