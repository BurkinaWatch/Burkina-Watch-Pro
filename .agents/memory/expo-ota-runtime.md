---
name: Expo OTA runtime
description: Conditions nécessaires pour qu’un APK Expo reçoive les mises à jour EAS dans ce workspace.
---

Un APK Android ne reçoit une OTA que si `expo-updates` est intégré au binaire natif, que `runtimeVersion` correspond, et que le profil EAS utilise explicitement le même canal que la publication. `expo-updates` doit rester dans les dépendances de production, pas seulement dans les devDependencies.

**Why:** Un premier APK sans `expo-updates` ne pouvait pas recevoir une mise à jour publiée après coup; EAS avertit aussi lorsqu’un profil avec canal trouve le module uniquement en dépendance de développement.

**How to apply:** Pour une première activation OTA, publier le bundle seulement après avoir configuré `updates.url`, `runtimeVersion`, le canal EAS et un nouvel APK; conserver une version runtime stable pour les correctifs JavaScript compatibles.

Un correctif JavaScript vérifié dans le preview ou dans le dépôt ne modifie pas un APK déjà installé : il faut soit installer un nouveau binaire, soit publier une OTA compatible avec le même runtime et le même canal.

**Why:** Le correctif de navigation mobile reste absent d’un APK téléchargé avant sa compilation, même lorsque le serveur Expo de développement affiche déjà la nouvelle interface.

**How to apply:** Pour une correction non publiée en OTA, reconstruire puis installer le nouvel APK par-dessus l’ancien; ne désinstaller qu’en dernier recours, car cela efface les données locales.