---
name: Station source fallback
description: Les stations-service doivent conserver la source BurkinaWatch quand la synchronisation OSM est vide.
---

La source OSM est complémentaire pour les stations-service, pas suffisante à elle seule : une réponse OSM valide peut contenir zéro lieu alors que le catalogue BurkinaWatch contient des fiches publiables.

**Why:** Une route qui remplaçait le catalogue curaté par le seul résultat OSM renvoyait HTTP 200 avec une liste vide aux clients Web et mobile.

**How to apply:** Pour les stations, partir du catalogue `stationsService`, ajouter les lieux OSM disponibles, puis appliquer les filtres et conserver une enveloppe API stable pour tous les clients.