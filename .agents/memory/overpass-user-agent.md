---
name: Requêtes Overpass
description: Contrainte des endpoints Overpass publics lors des synchronisations OSM.
---

Les requêtes envoyées aux endpoints Overpass publics doivent inclure un User-Agent explicite et accepter JSON.

**Why:** certains endpoints refusent les requêtes anonymes avec 406 ou 429; l’échec peut sinon être transformé en réponse vide et masquer un catalogue pourtant disponible.

**How to apply:** conserver un User-Agent descriptif sur chaque requête Overpass et traiter les réponses refusées comme un échec de synchronisation, sans effacer les données déjà présentes.