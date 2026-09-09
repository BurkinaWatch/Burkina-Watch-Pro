---
name: Expo local assets
description: Les images utilisées par l’application mobile doivent rester dans le périmètre Metro de l’artefact Expo.
---

Les images propres à l’interface mobile doivent être copiées dans le dossier de l’artefact Expo et importées comme assets statiques, plutôt que chargées depuis `attached_assets` ou une URL de preview.

**Why:** Metro ne surveille pas automatiquement les dossiers voisins et une URL de développement n’est pas fiable dans un bundle mobile publié.

**How to apply:** Pour tout nouveau visuel mobile, placer le fichier sous `artifacts/burkinawatch-mobile/assets/`, ajouter la déclaration de type si nécessaire, puis vérifier le bundle Expo.