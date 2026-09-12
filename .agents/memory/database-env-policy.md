---
name: Politique des variables PostgreSQL
description: La connexion PostgreSQL de lib/db et de l’API utilise la variable DATABASE_URL
---

`DATABASE_URL` est désormais la seule variable PostgreSQL supportée par `lib/db`, le pool API, les sessions et les contrôles de production. `RAILWAY_DATABASE_URL` n’est plus une variante active.

**Why:** Une convention unique évite qu’un déploiement Railway fournisse une variable que certains modules ignorent, provoquant un échec au démarrage ou dans un parcours d’authentification.

**How to apply:** Lors d’un changement de configuration ou déploiement, configurer `DATABASE_URL` sur le service API et vérifier qu’aucun nouveau fallback PostgreSQL n’est introduit.