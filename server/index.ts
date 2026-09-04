import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import compression from "compression";
import { pharmaciesService } from "./pharmaciesService";
import { applySecurityMiddlewares } from "./securityHardening";
import { assertProductionSecurityConfiguration } from "./securityConfig";
import { redactSensitiveData, redactSensitiveText } from "./securityRedaction";
import { assertStreetviewStorageConfigured } from "./streetviewStorage";

assertProductionSecurityConfiguration();
assertStreetviewStorageConfigured();
const app = express();

// Appliquer les middlewares de sécurité EN PREMIER
applySecurityMiddlewares(app);

app.use(compression());

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Nettoyage des données sensibles avant le log
       const logBody = redactSensitiveData(capturedJsonResponse);

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (logBody) {
         logLine += ` :: ${redactSensitiveText(JSON.stringify(logBody))}`;
      }

      // Ne jamais logger les cookies ou les headers sensibles
      if (logLine.length > 200) {
        logLine = logLine.slice(0, 199) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
   const message = redactSensitiveText(err.message || "Internal Server Error");

   res.status(status).json({
     message:
       process.env.NODE_ENV === "production"
         ? "Internal Server Error"
         : message,
   });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Démarrer les mises à jour automatiques
  pharmaciesService.scheduleAutoUpdate();
  
  // Importer et démarrer la mise à jour automatique des événements
  const { scheduleAutoUpdate: scheduleEventsUpdate } = await import("./eventsService");
  scheduleEventsUpdate();
  
  // Importer et démarrer la mise à jour automatique des urgences
  const { scheduleAutoUpdate: scheduleUrgenciesUpdate } = await import("./urgenciesService");
  scheduleUrgenciesUpdate();
  
  // Importer et démarrer le service Ouaga en 3D
  const { ouaga3dService } = await import("./services/ouaga3dService");
  ouaga3dService.scheduleAutoUpdate();
  
  // Synchroniser les lieux OpenStreetMap (Restaurants, Marchés, Boutiques)
  const { overpassService } = await import("./overpassService");
  // Lancer la sync en arrière-plan sans bloquer le démarrage
  overpassService.syncAllPlaces().then(() => {
    console.log("✅ Synchronisation OpenStreetMap terminée");
  }).catch(err => {
    console.error("❌ Erreur synchronisation OpenStreetMap:", err);
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();