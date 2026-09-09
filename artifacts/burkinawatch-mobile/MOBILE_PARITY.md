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
| `/profil` | Onglet Profil | `GET /api/auth/user` avec bearer mobile; déconnexion par révocation du refresh token | Mode invité ou identité synchronisée |
| `/connexion` | Connexion | OTP email puis contrat access/refresh mobile, jetons dans SecureStore | Code invalide ou expiré explicite |
| `/signalement/:id` | Détail | `GET /api/signalements/:id` | Erreur et bouton de reprise |

## Catalogue de services

L’écran **Tous les services** expose les routes existantes `/leaderboard`, `/tracking-live`, `/surveillance`, `/contribuer`, `/pharmacies`, `/urgences`, `/bulletin`, `/events`, `/streetview`, `/ouaga3d`, `/restaurants`, `/boutiques-marches`, `/marches`, `/boutiques`, `/banques`, `/stations`, `/hopitaux`, `/universites`, `/gares`, `/cine`, `/meteo`, `/hotels`, `/cimetieres`, `/sonabel-onea`, `/mairies-prefectures`, `/telephonie`, `/ministeres`, `/lieux-de-culte`, `/a-propos`, `/fiabilite`, `/conditions`, `/confidentialite`, `/guide` et `/notifications`.

Les parcours qui dépendent de contrôles Web ou de contrats API non exposés par le client mobile ouvrent la route Web officielle. Cette transition est volontaire : elle ne contourne ni l’autorisation serveur, ni les sessions, ni la propriété des contenus.

## Limites contractuelles documentées

- Le Web conserve sa session cookie; le mobile utilise `POST /api/auth/mobile/token`, `POST /api/auth/mobile/refresh` et `POST /api/auth/mobile/logout` sans réutiliser ce cookie.
- Le mobile reçoit un access token bearer de 15 minutes et un refresh token opaque rotatif de 30 jours. Le serveur ne stocke que le hash du refresh token; chaque rotation révoque le précédent.
- `Authorization: Bearer <accessToken>` est interprété par la même identité `req.user` que le Web. Les routes protégées continuent donc d’appliquer les contrôles de propriété et de modération côté serveur.
- Contrat exact: `POST /api/auth/send-otp` reçoit `{ identifier, type: "email" | "sms" }`; `POST /api/auth/mobile/token` reçoit `{ identifier, code, type }` et renvoie `{ accessToken, refreshToken, tokenType: "Bearer", expiresIn, user }`; `POST /api/auth/mobile/refresh` reçoit `{ refreshToken }` et renvoie une nouvelle paire; `POST /api/auth/mobile/logout` reçoit `{ refreshToken }` et révoque cette session.
- La publication mobile reste un brouillon local jusqu’à l’existence d’un contrat d’upload documenté; l’identité access/refresh est désormais disponible.
- Les notifications personnelles nécessitent une session compatible mobile; l’écran distingue l’erreur d’authentification d’une absence de notification.
- Le contrat d’authentification mobile ne modifie pas les données existantes; il utilise la table `refresh_tokens` déjà prévue par le schéma.