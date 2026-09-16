---
name: Validation isolée
description: Contrainte de concurrence entre release-check et les workflows locaux.
---

Les contrôles de publication doivent créer une copie temporaire du workspace, y installer les dépendances et y lancer les typechecks/builds. Ils ne doivent pas supprimer, forcer ou remplacer les `node_modules` du workspace actif.

**Why:** Metro et Vite surveillent les paquets du workspace. Une installation pnpm concurrente peut renommer temporairement un paquet en suffixe `_tmp`, puis faire tomber le watcher avec une erreur `ENOENT`.

**How to apply:** Exclure `.git`, `node_modules`, caches, sorties de build et fichiers `tsbuildinfo` de la copie; nettoyer la copie même si un outil natif a créé des fichiers protégés.

Une exécution concurrente peut aussi faire échouer l’archivage initial avec `tar: ... file changed as we read it`, notamment quand l’installation PNPM modifie `.local/share/pnpm` pendant la copie.

**Why:** Cette erreur concerne la copie locale du workspace, pas le build Railway, qui n’exécute pas ce pipeline d’archivage.

**How to apply:** Relancer `release-check` après stabilisation des installations/workflows; ne pas traiter cette course locale comme un échec du build applicatif.