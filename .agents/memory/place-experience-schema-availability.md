---
name: Contexte lieu sans schéma publié
description: Règle de compatibilité pour les lectures publiques de l’expérience du lieu lorsque le schéma optionnel n’est pas encore disponible.
---

Les lectures publiques du contexte d’un lieu et les tâches d’entretien au démarrage doivent dégrader gracieusement si les tables optionnelles de présence ou de perception ne sont pas encore publiées. Elles peuvent retourner les données existantes, signaler l’absence de données récentes et ignorer la purge, mais ne doivent pas lancer de migration implicite.

**Why:** Les environnements de développement et de publication peuvent ne pas partager le même état de schéma, et les changements Railway nécessitent une confirmation séparée.

**How to apply:** Encadrer les lectures et la purge des tables optionnelles, traiter l’absence de relation PostgreSQL `42P01` comme une absence de perceptions/données à purger, et continuer à agréger les signaux/incidents déjà disponibles.