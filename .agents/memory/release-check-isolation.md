---
name: Validation isolée
description: Contrainte de concurrence entre release-check et les workflows locaux.
---

Les contrôles de publication doivent créer une copie temporaire du workspace, y installer les dépendances et y lancer les typechecks/builds. Ils ne doivent pas supprimer, forcer ou remplacer les `node_modules` du workspace actif.

**Why:** Metro et Vite surveillent les paquets du workspace. Une installation pnpm concurrente peut renommer temporairement un paquet en suffixe `_tmp`, puis faire tomber le watcher avec une erreur `ENOENT`.

**How to apply:** Exclure `.git`, `node_modules`, caches, sorties de build et fichiers `tsbuildinfo` de la copie; nettoyer la copie même si un outil natif a créé des fichiers protégés.

Une exécution concurrente peut aussi faire échouer l’archivage initial avec `tar: ... file changed as we read it`, notamment quand les journaux et outils Replit modifient `.local` pendant la copie.

**Why:** Cette erreur concerne la copie locale du workspace, pas le build Railway, qui n’exécute pas ce pipeline d’archivage.

**How to apply:** Exclure entièrement `.local` de la copie de validation, ainsi que le contenu récursif des caches et sorties générées; ne pas traiter cette course locale comme un échec du build applicatif.

Les builds de production Vite et Expo ne doivent pas être lancés en parallèle dans le workspace actif.

**Why:** Leur exécution simultanée peut dépasser la mémoire disponible et redémarrer entièrement le workspace. Dans le même environnement, un grand build Vite peut aussi être interrompu par la limite mémoire alors que le typecheck et le serveur de développement restent sains.

**How to apply:** Exécuter les builds lourds un par un. Si le workspace redémarre sans diagnostic applicatif, confirmer d’abord avec les typechecks et les serveurs de développement; ne pas attribuer ce redémarrage à une erreur de code sans trace de compilation correspondante.