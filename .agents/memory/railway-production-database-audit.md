---
name: Audit base production Railway
description: La production active est servie par Railway, tandis que la base de production Replit peut être absente.
---

La vérification des données de production doit viser la connexion PostgreSQL Railway utilisée par le déploiement actif. `executeSql(..., environment: "production")` peut répondre qu’aucune base de production Replit n’existe, même lorsque l’application Railway est opérationnelle.

**Why:** Le domaine public a servi l’application Railway alors que le service de base de données de production Replit n’était pas provisionné ; interroger la mauvaise cible donne une conclusion erronée.

**How to apply:** Identifier la cible de production avant de conclure à une base vide, puis exécuter la lecture SQL sur la base Railway sans afficher la valeur de connexion.