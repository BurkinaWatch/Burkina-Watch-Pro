---
name: Dérive de la commande Railway
description: Railway peut conserver une commande de démarrage qui référence un script absent du dépôt
---

Railway peut exécuter une commande de démarrage configurée au niveau du service qui diverge de `railway.json` et du dépôt. Un wrapper de démarrage versionné, appelé par les deux chemins, réduit le risque d'un conteneur qui boucle avant d'ouvrir son port.

**Why:** Un déploiement a tenté d'appeler `scripts/pre-start.sh` alors que le fichier n'existait pas dans le commit déployé; le build de l'image réussissait mais le service restait indisponible.

**How to apply:** Garder la commande Railway et le script `package.json` alignés sur un wrapper présent dans le dépôt; ne pas cacher de migration de production dans ce wrapper sans autorisation explicite.