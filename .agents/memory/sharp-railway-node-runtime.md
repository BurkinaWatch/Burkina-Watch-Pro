---
name: Runtime Sharp sur Railway
description: Contrainte de runtime Railway/Nixpacks pour Sharp et les dépendances natives.
---

Railway/Nixpacks peut sélectionner Node 18 par défaut même lorsque l’environnement Replit utilise une version plus récente. Les dépendances natives comme Sharp doivent avoir une contrainte Node explicite compatible avec leur version.

**Why:** `sharp@0.35.4` refuse de démarrer sous Node 18 et le conteneur échoue avant le health check; un build local réussi ne suffit donc pas à valider le runtime Railway.

**How to apply:** Lorsqu’une dépendance native est ajoutée ou mise à jour, vérifier la version Node réellement utilisée dans les logs Railway et déclarer une contrainte compatible dans le manifeste racine avant publication.