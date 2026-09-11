---
name: Schémas Railway et développement
description: Différence entre la base de développement Drizzle et la base Railway utilisée par l’API
---

L’API utilise `RAILWAY_DATABASE_URL` lorsqu’il est disponible, tandis que `pnpm --filter @workspace/db push` cible `DATABASE_URL`. Ces deux bases ne sont donc pas nécessairement identiques.

**Why:** Une migration poussée uniquement sur la base de développement peut laisser le preview API sur Railway sans les colonnes attendues et provoquer des erreurs SQL.

**How to apply:** Pour une évolution de schéma destinée à l’API, conserver une compatibilité de lecture avec l’ancien schéma et laisser la migration Railway suivre le flux de publication prévu par le projet; ne pas exécuter de DDL directement sur la base de production.