---
name: Routage Web et API Railway
description: Architecture de publication où Railway sert le frontend à la racine et l’API sous /api.
---

Railway doit construire le frontend Web et l’API, puis démarrer l’API avec le service Web activé : `/` et les routes SPA servent les fichiers statiques, tandis que `/api/*` reste traité par Express.

**Why:** Le domaine personnalisé pointait vers le serveur API seul, qui répondait `Cannot GET /` même si `/api/healthz` fonctionnait.

**How to apply:** Garder le build Web et API dans la commande Railway, activer `SERVE_WEB=true`, et vérifier `/`, une route SPA et `/api/healthz` après chaque publication.