---
name: Installation post-fusion
description: Contrainte du cache de dépendances lors des réconciliations automatiques après fusion.
---

Le script de post-fusion doit pouvoir utiliser le registre interne de paquets lorsque le lockfile contient une archive absente du store local; le mode hors ligne n’est pas une garantie de reproductibilité dans cet environnement.

**Pourquoi :** une fusion mobile a ajouté une dépendance Expo qui figurait bien dans le lockfile mais dont l’archive n’était pas encore présente dans le cache local. Le mode hors ligne a donc fait échouer une installation pourtant résoluble par le registre interne.

**Comment l’appliquer :** conserver l’installation figée sur le lockfile, mais ne pas ajouter `--offline` au script de post-fusion. Garder les opérations de base de données hors de ce script.