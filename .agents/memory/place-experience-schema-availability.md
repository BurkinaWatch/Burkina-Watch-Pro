---
name: Contexte lieu sans schéma publié
description: Règle de compatibilité pour les lectures publiques de l’expérience du lieu lorsque le schéma optionnel n’est pas encore disponible.
---

Les lectures publiques du contexte d’un lieu doivent dégrader gracieusement si les tables optionnelles de présence ou de perception ne sont pas encore publiées. Elles peuvent retourner les données existantes et signaler l’absence de données récentes, mais ne doivent pas lancer de migration implicite.

**Why:** Les environnements de développement et de publication peuvent ne pas partager le même état de schéma, et les changements Railway nécessitent une confirmation séparée.

**How to apply:** Encadrer uniquement la lecture des tables optionnelles, traiter l’absence de relation PostgreSQL comme une absence de perceptions, et continuer à agréger les signaux/incidents déjà disponibles.