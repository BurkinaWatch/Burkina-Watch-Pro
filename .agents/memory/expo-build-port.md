---
name: Build Expo statique
description: Contrainte de port du build statique Expo dans ce workspace multi-artefacts.
---

Le script de build statique Expo utilise un port Metro configurable (`METRO_PORT` ou `EXPO_PACKAGER_PORT`), avec 8081 comme valeur par défaut. Le contrôle de publication réserve 8082 pour éviter le port utilisé par `mockup-sandbox`.

**Why:** Le build statique échouait avant la compilation si 8081 était occupé, en proposant un autre port en mode non interactif.

**How to apply:** Fournir un port Metro libre lors des builds isolés; ne pas interpréter une collision de port comme une erreur de l’application mobile.