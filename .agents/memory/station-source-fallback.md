---
name: Catalogues locaux et OSM
description: Les catalogues BurkinaWatch doivent rester publiables quand une synchronisation OSM renvoie zéro résultat.
---

La source OSM est complémentaire pour les catalogues curatés, pas suffisante à elle seule : une réponse OSM valide peut contenir zéro lieu alors que BurkinaWatch contient des fiches publiables. Cette règle couvre notamment les stations-service, boutiques, agences téléphoniques et banques.

**Why:** Une route qui remplaçait le catalogue curaté par le seul résultat OSM renvoyait HTTP 200 avec une liste vide aux clients Web et mobile.

**How to apply:** Pour les types couverts par un catalogue local, conserver ce catalogue si OSM renvoie zéro élément; si OSM contient des lieux, appliquer la priorité définie par la route sans transformer un résultat vide en suppression de données.