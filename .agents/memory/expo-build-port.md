---
name: Build Expo statique
description: Contrainte de port du build statique Expo dans ce workspace multi-artefacts.
---

Le script de build statique Expo vérifie et télécharge les bundles sur `localhost:8081`. Dans ce workspace, ce port est déjà utilisé par `mockup-sandbox`, alors que le workflow Expo de développement utilise son port attribué et fonctionne indépendamment.

**Why:** Le build statique échoue avant la compilation si 8081 est occupé, en proposant un autre port en mode non interactif.

**How to apply:** Vérifier la disponibilité de 8081 avant un build statique Expo; ne pas interpréter cet échec de port comme une erreur de l’application mobile.