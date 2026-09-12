---
name: Politique des variables PostgreSQL
description: Le dépôt distingue actuellement la connexion directe de lib/db et la politique Railway de l’API
---

`lib/db` exige `DATABASE_URL`, tandis que l’API peut privilégier `RAILWAY_DATABASE_URL` et ses contrôles de production peuvent exiger cette variable séparément.

**Why:** Cette double convention peut permettre au build de réussir tout en faisant échouer le démarrage ou un parcours d’authentification selon la variable configurée.

**How to apply:** Lors d’un prochain changement de configuration ou déploiement, traiter les deux variables comme une incohérence à résoudre explicitement; ne pas supposer qu’elles sont interchangeables sans vérifier tous les consommateurs.