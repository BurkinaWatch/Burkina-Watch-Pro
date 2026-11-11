---
name: Build Android sous mémoire contrainte
description: Répartition mémoire fiable pour compiler un APK React Native/Expo dans une petite machine.
---

Pour un APK de test local sous une limite mémoire stricte, cibler une seule architecture Android moderne, désactiver le parallélisme Gradle et utiliser un seul worker. Désactiver temporairement la nouvelle architecture React Native peut réduire la pression native si l’objectif est seulement de produire un APK installable.

**Why:** La compilation C++ multi-architecture peut faire tuer le daemon même avec un heap Java raisonnable. À l’inverse, une metaspace trop basse laisse finir le natif mais fait échouer `lintVitalAnalyzeRelease` avec `OutOfMemoryError: Metaspace`.

**How to apply:** Réduire d’abord le parallélisme et le nombre d’architectures; garder un heap contenu mais une metaspace suffisante pour Lint. Considérer les overrides d’architecture React Native comme propres à la commande de build, pas comme un changement produit permanent.

Un APK destiné à être partagé avec des appareils Android non identifiés doit inclure au minimum `armeabi-v7a` et `arm64-v8a`, même si cela augmente sa taille.

**Why:** Un APK limité à ARM64 est valide et signé, mais Android 10 affiche seulement « Application non installée » sur certaines tablettes dont le système reste 32 bits.

**How to apply:** Réserver les APK mono-architecture aux appareils connus. Avant livraison publique, inspecter les dossiers `lib/` de l’APK et vérifier la signature avec `apksigner`.

Pour les tablettes Android anciennes, le packaging legacy des bibliothèques natives reste le choix de compatibilité par défaut; une version universelle peut aussi inclure x86 et x86_64 lorsque l’architecture de l’appareil est inconnue.

**Why:** La validation d’un APK ARM signé ne suffit pas à garantir son installation sur un appareil réel; les appareils Android 10 peuvent encore être 32 bits ou x86, et certains installateurs gèrent mieux les bibliothèques extraites.

**How to apply:** Pour un livrable de dépannage, augmenter le versionCode, activer `expo.useLegacyPackaging` et inspecter les quatre dossiers ABI avant de remettre le fichier à l’utilisateur.