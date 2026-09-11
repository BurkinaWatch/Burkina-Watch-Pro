---
name: Installations Railway propres
description: Règle de validation des dépendances TypeScript dans un workspace pnpm déployé sur Railway
---

Les paquets de types utilisés par un workspace doivent être déclarés directement dans le manifeste de ce workspace, même lorsqu’ils sont visibles dans un `node_modules` local via une dépendance transitive ou une installation précédente.

**Why:** Une installation Railway propre avec `pnpm install --frozen-lockfile --prefer-offline` a révélé des types absents que l’environnement local résolvait par hasard; le typecheck local ne suffisait donc pas à prouver que le déploiement utiliserait les mêmes dépendances.

**How to apply:** Après toute modification de dépendances, régénérer et vérifier le lockfile, puis exécuter l’installation gelée et le typecheck/build racine avant de diagnostiquer ou modifier le code source.