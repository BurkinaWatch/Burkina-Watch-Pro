---
name: Schémas Railway et développement
description: Variable unique à utiliser pour la base PostgreSQL en développement et sur Railway
---

`DATABASE_URL` est la seule variable de connexion PostgreSQL supportée par Drizzle, l’API, les sessions et les contrôles de production. Sur Railway, la connexion PostgreSQL doit donc être exposée sous ce nom.

**Why:** Deux noms de variables permettaient à l’API et aux outils de schéma de cibler des bases différentes sans échec explicite.

**How to apply:** Configurer `DATABASE_URL` dans chaque environnement et lancer le contrôle de politique avant publication; ne pas exécuter de DDL directement sur la base de production.