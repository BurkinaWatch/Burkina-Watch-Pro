---
name: Enveloppes API des services mobiles
description: Les services pratiques partagent des routes mais pas une enveloppe JSON unique, et les listes ne doivent pas sonder le contexte de chaque fiche sans limite.
---

Les clients mobiles qui réutilisent le catalogue Web doivent normaliser explicitement les enveloppes par service (`places`, `agences`, `institutions`, `lieux`, `gares`, etc.) et limiter les lectures secondaires par fiche dans une liste.

**Why:** Une normalisation limitée à `places` affiche à tort des listes vides, tandis qu’un appel de contexte par élément peut saturer la limitation de débit sur les catégories volumineuses.

**How to apply:** Vérifier le contrat de chaque route dans l’API avant d’ajouter une catégorie mobile, puis réserver les requêtes secondaires à un aperçu borné ou à une fiche détail.