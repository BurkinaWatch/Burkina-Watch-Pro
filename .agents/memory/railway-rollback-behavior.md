---
name: Comportement des rollbacks Railway
description: Le rollback Railway réactive l’ancien commit via un nouveau déploiement qui peut rester en déploiement pendant plusieurs minutes.
---

Un rollback Railway ne rend pas nécessairement l’ancien déploiement actif instantanément : il crée un nouveau déploiement à partir de l’ancien commit, tandis que l’ancien enregistrement peut rester marqué comme supprimé. Il faut attendre le statut `SUCCESS` et vérifier l’URL publique avant de confirmer le rétablissement.

**Why:** Lors d’un incident, l’API de rollback a accepté l’opération alors que l’URL renvoyait temporairement `502` pendant la création du nouveau conteneur.

**How to apply:** Après chaque rollback, suivre le nouveau déploiement créé, lire ses logs de démarrage, puis tester au minimum la route publique principale avec `curl`.