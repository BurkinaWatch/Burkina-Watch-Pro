# BurkinaWatch Mobile — matrice de parité

L’application mobile est un compagnon natif du site BurkinaWatch. Elle conserve les mêmes noms de concepts et réutilise l’API existante quand un contrat public est disponible.

## Parcours natifs

| Web | Mobile | Données / permissions | Hors-ligne |
| --- | --- | --- | --- |
| `/` | Accueil | `GET /api/signalements`, `GET /api/stats` | État vide ou erreur explicite, sans fausse donnée |
| `/feed`, `/fil-actualite` | Fil d’actualité | `GET /api/signalements` | Rechargement manuel |
| `/carte` | Carte & services | `GET /api/signalements`, localisation au premier geste | La carte reste consultable; la position n’est pas inventée |
| `/publier` | Nouveau signalement | Caméra et localisation facultatives; brouillons dans AsyncStorage | Brouillon local conservé |
| `/sos`, `/sos/publier` | SOS + signaler | Appels natifs `tel:`; caméra/localisation facultatives | Les numéros d’urgence restent visibles |
| `/notifications` | Onglet Alertes | `GET /api/notifications` avec identité serveur | Message de reconnexion explicite |
| `/profil` | Onglet Profil | Aucun cookie Web réutilisé | Mode invité |
| `/connexion` | Connexion | Ouverture de la connexion Web tant que le contrat access/refresh mobile n’existe pas | Aucun jeton inventé |
| `/signalement/:id` | Détail | `GET /api/signalements/:id` | Erreur et bouton de reprise |

## Catalogue de services

L’écran **Tous les services** expose les routes existantes `/leaderboard`, `/tracking-live`, `/surveillance`, `/contribuer`, `/pharmacies`, `/urgences`, `/bulletin`, `/events`, `/streetview`, `/ouaga3d`, `/restaurants`, `/boutiques-marches`, `/marches`, `/boutiques`, `/banques`, `/stations`, `/hopitaux`, `/universites`, `/gares`, `/cine`, `/meteo`, `/hotels`, `/cimetieres`, `/sonabel-onea`, `/mairies-prefectures`, `/telephonie`, `/ministeres`, `/lieux-de-culte`, `/a-propos`, `/fiabilite`, `/conditions`, `/confidentialite`, `/guide` et `/notifications`.

Les parcours qui dépendent de contrôles Web ou de contrats API non exposés par le client mobile ouvrent la route Web officielle. Cette transition est volontaire : elle ne contourne ni l’autorisation serveur, ni les sessions, ni la propriété des contenus.

## Limites contractuelles documentées

- Le backend actuel expose une session cookie Web; l’application native ne la partage pas et ne fabrique pas de JWT.
- La publication mobile reste un brouillon local jusqu’à l’existence d’un contrat access/refresh et upload documenté.
- Les notifications personnelles nécessitent une session compatible mobile; l’écran distingue l’erreur d’authentification d’une absence de notification.
- Aucune table, route backend, configuration Railway ou donnée existante n’est modifiée par cet artefact.