---
name: Nettoyage image et codecs natifs
description: Contraintes de réencodage Sharp et de support des formats image sur le déploiement Railway
---

Les images uploadées doivent être classifiées par magic bytes, contrôlées par dimensions et réencodées sans métadonnées avant stockage. Les codecs HEIC/AVIF ne doivent pas être supposés disponibles sur Railway : s’ils ne sont pas supportés par Sharp/libvips au runtime, il faut les refuser explicitement plutôt que conserver l’original.

**Why:** Le build API externalise les modules natifs de Sharp, mais la configuration Nixpacks du dépôt ne garantit pas la présence de libheif ni des codecs HEIC/AVIF.

**How to apply:** Garder Sharp en dépendance directe de l’API, conserver son externalisation esbuild, vérifier les capacités natives au runtime et utiliser une constante partagée pour chaque limite de taille d’image.