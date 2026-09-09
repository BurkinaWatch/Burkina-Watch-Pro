# Audit technique complet — BurkinaWatch Web + Mobile Expo + OTA

**Date de l’audit :** 8 septembre 2026  
**Mode appliqué :** lecture seule  
**Périmètre :** application Web, backend/API, PostgreSQL, Railway, authentification, médias, application mobile Expo et EAS/OTA

> Aucun fichier applicatif, package, secret, workflow, migration, configuration Railway ou déploiement n’a été modifié pendant l’audit. Ce fichier est uniquement le livrable du rapport demandé.

---

## A. RÉSUMÉ EXÉCUTIF

BurkinaWatch est actuellement une application Web React/Vite complète, avec un backend Express/TypeScript et une base PostgreSQL utilisée via Drizzle ORM.

Le Web possède déjà de nombreuses fonctionnalités métier :

- signalements citoyens ;
- SOS et suivi de position ;
- carte et géolocalisation ;
- notifications Web Push ;
- mode offline partiel ;
- établissements et services urbains ;
- urgences, événements, météo et actualités ;
- chatbot IA ;
- Street View participatif ;
- traitement vidéo CPU ;
- surveillance de caméras via RTSP/MediaMTX/WebRTC ;
- comptes utilisateurs et authentification OTP/session.

En revanche :

- aucune application Expo réelle n’existe actuellement ;
- aucun code React Native n’est présent ;
- aucun projet iOS ou Android n’est présent ;
- aucun pipeline EAS Build ou EAS Update n’est configuré ;
- aucune stratégie OTA mobile n’existe actuellement ;
- la logique Web et backend n’est pas encore organisée comme un monorepo Web + Mobile partagé.

L’architecture actuelle est donc une bonne base backend pour ajouter une application mobile, mais elle n’est pas encore prête pour une consommation mobile équivalente.

Le problème immédiat n’est pas Expo. C’est la stabilité de la production Railway :

1. le lockfile npm contaminé par les URLs internes Replit a été corrigé ;
2. le build peut maintenant terminer ;
3. le runtime Railway échoue encore lorsque `RAILWAY_DATABASE_URL` est absente ;
4. d’autres variables de production devront probablement être vérifiées ensuite ;
5. la provenance et l’alignement exacts des migrations PostgreSQL restent à confirmer avant toute nouvelle migration.

### Verdict synthétique

| Élément | État actuel | Conclusion |
|---|---|---|
| Web principal | Fonctionnel et riche | À conserver |
| Backend partagé | Présent | Réutilisable par Mobile |
| PostgreSQL partagé | Présent, Railway comme source de vérité | Compatible |
| Logique métier partagée | Partielle | À extraire progressivement |
| Application Expo | Absente | À créer |
| Authentification Mobile | Non définie | À concevoir avant Expo |
| EAS Build | Absent | À ajouter |
| EAS Update / OTA | Absent | Possible après création Expo |
| Railway | Build corrigé, runtime encore bloqué par configuration | À stabiliser en premier |

---

## B. ARCHITECTURE ACTUELLE

### Structure vérifiée

```text
BurkinaWatch
├── client/
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   └── assets/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── i18n/
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── db.ts
│   ├── databaseConfig.ts
│   ├── securityConfig.ts
│   ├── replitAuth.ts
│   ├── hybridAuthService.ts
│   ├── streetview*
│   ├── videoGateway.ts
│   ├── mediaMtxGateway.ts
│   └── services/
├── shared/
│   └── schema.ts
├── migrations/
├── scripts/
├── experiments/
├── docker-compose.phase5.yml
├── docker-compose.phase8-2.yml
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── .replit
└── .nvmrc
```

### Chaîne d’exécution

```text
Navigateur Web
      |
      v
React + Vite
      |
      v
Express / TypeScript
      |
      ├── Routes API
      ├── Authentification/session
      ├── Services métier
      ├── Workers et timers
      ├── S3 / stockage
      ├── MediaMTX / RTSP
      └── APIs externes
      |
      v
Drizzle ORM + node-postgres
      |
      v
PostgreSQL Railway
```

### Technologies

- Frontend : React + TypeScript.
- Bundler : Vite.
- Routing Web : Wouter.
- État serveur : TanStack React Query.
- Backend : Express + TypeScript ESM.
- ORM : Drizzle ORM.
- Base : PostgreSQL.
- Driver : `pg`.
- Build serveur : esbuild.
- Runtime ciblé : Node.js 20.x.
- Package manager : npm 10.8.x.
- Cartographie active : Leaflet/react-leaflet + OpenStreetMap.
- Notifications : Web Push/VAPID.
- Stockage production Street View : S3-compatible.
- Vidéo surveillance : RTSP, MediaMTX et WebRTC/WHEP.
- IA : Gemini, Groq/OpenAI selon configuration.
- Email : Resend/SMTP.
- Authentification actuelle principalement basée sur OTP et session.

---

## C. ARCHITECTURE MOBILE ACTUELLE

Il n’existe actuellement aucune application mobile native dans le dépôt.

### Ce qui existe

```text
Application Web responsive
      |
      ├── PWA manifest
      ├── Service Worker
      ├── Web Push
      ├── IndexedDB
      ├── cache React Query
      └── mode standalone sur mobile
```

Fichiers concernés :

- `client/public/manifest.json`
- `client/public/sw.js`
- `client/src/lib/pushNotifications.ts`
- `client/src/lib/offlineStorage.ts`
- `client/src/lib/syncService.ts`

### Ce qui n’existe pas

Aucun des éléments suivants n’a été trouvé :

- `expo` ;
- `react-native` ;
- `expo-updates` ;
- `eas.json` ;
- `app.json` ou `app.config.*` ;
- `metro.config.*` ;
- `babel.config.*` mobile ;
- dossiers `ios/` ou `android/` ;
- Podfile ;
- Gradle/Gradlew ;
- projet Xcode ;
- code Swift, Objective-C, Kotlin ou Java mobile ;
- Fastlane ;
- Detox ou Maestro ;
- workflow EAS ;
- channel ou runtime version OTA.

La présence de `expo-sqlite` ou `react-native` comme peer dependencies optionnelles dans le lockfile ne constitue pas une intégration mobile.

### Conclusion

La PWA est installable sur mobile, mais elle n’est pas une application Expo et ne peut pas être distribuée via l’App Store, Google Play ou EAS dans son état actuel.

---

## D. ARCHITECTURE CIBLE RECOMMANDÉE

L’architecture cible recommandée est additive :

```text
                         BURKINAWATCH
                              |
                +-------------+-------------+
                |                           |
              WEB                         MOBILE
                |                           |
       React/Vite/Wouter              Expo/React Native
                |                           |
                +-------------+-------------+
                              |
                     API HTTP versionnée
                              |
                   Authentification commune
                              |
                        Backend Express
                              |
              +---------------+----------------+
              |                                |
        Services métier                    PostgreSQL
              |                                |
              +----------------+---------------+
                               |
                             Railway
                               |
             +-----------------+------------------+
             |                                    |
        S3-compatible                         Workers
        Street View                     traitement asynchrone
```

### Organisation cible recommandée

```text
client/                  # Web existant
apps/mobile/             # Nouvelle application Expo
shared/contracts/        # DTO, validation, types d'API
shared/domain/           # logique pure réellement portable
server/                  # API et services backend
migrations/              # migrations PostgreSQL
```

Le Web doit rester l’application principale. Il ne faut pas transformer le frontend Web en React Native.

---

## E. INVENTAIRE DES FONCTIONNALITÉS

| Domaine | Présence Web | Backend/API | État Mobile | Remarques |
|---|---:|---:|---:|---|
| Accueil/dashboard | Oui | Oui | À créer | Fonctionnalité réutilisable via API |
| Inscription/connexion OTP | Oui | Oui | Non adapté | Session Web actuelle, stratégie bearer à prévoir |
| Magic link | Partiel | Oui | Non adapté | Flux à revoir avant usage Mobile |
| Profil utilisateur | Oui | Oui | À créer | Modèle partagé possible |
| Signalements | Oui | Oui | À créer | Domaine principal réutilisable |
| Photos signalement | Oui | Oui | À créer | Actuellement base64 JSON |
| Vidéos signalement | Oui | Oui | À créer | Coût mémoire et taille à surveiller |
| SOS | Oui | Oui | À créer | Important pour géolocalisation native |
| Contacts d’urgence | Oui | Oui | À créer | API existante |
| Panic alert | Oui | Oui | À créer | Nécessite stratégie mobile robuste |
| Suivi live | Oui | Oui | À créer | Polling, pas WebSocket |
| Carte | Oui | Oui | À créer | Leaflet Web à remplacer/adapter côté Mobile |
| Géolocalisation | Oui | Oui | À créer | APIs natives nécessaires en arrière-plan |
| Notifications applicatives | Oui | Oui | À créer | Polling Web actuel |
| Web Push | Oui | Oui | Non réutilisable directement | APNs/FCM nécessaires en natif |
| Offline signalements | Oui | Oui | À concevoir | IndexedDB Web non partageable tel quel |
| Pharmacies | Oui | Oui | À créer | API réutilisable |
| Urgences | Oui | Oui | À créer | API réutilisable |
| Hôpitaux | Oui | Oui | À créer | API réutilisable |
| Stations | Oui | Oui | À créer | API réutilisable |
| Banques | Oui | Oui | À créer | API réutilisable |
| Marchés/boutiques | Oui | Oui | À créer | API réutilisable |
| Restaurants | Oui | Oui | À créer | API réutilisable |
| Transport/gares | Oui | Oui | À créer | API réutilisable |
| Actualités/RSS | Oui | Oui | À créer | API réutilisable |
| Événements | Oui | Oui | À créer | API réutilisable |
| Météo | Oui | Oui | À créer | API réutilisable |
| Chatbot IA | Oui | Oui | À créer | API réutilisable |
| Leaderboard/gamification | Oui | Oui | À créer | API réutilisable |
| Street View vidéo | Oui | Oui | À créer | Caméra native recommandée |
| Street View processing | Oui côté API | Oui | Indirect | Worker serveur |
| Reconstruction 3D | Non validée | Préparation seulement | Non | Ne pas promettre une reconstruction réelle |
| Visites virtuelles | Oui | Oui | À créer | Sécurisation nécessaire |
| Ouaga3D | Route Web | Oui partiel | Non | La page Web redirige vers Street View |
| Surveillance caméras | Oui | Oui | À étudier | WebRTC/WHEP et permissions spécifiques |
| Admin | Page existante mais non routée | Endpoints partiels | Non | Administration à clarifier |
| SMS | Non opérationnel | Partiel | Non | Twilio non disponible actuellement |
| WebSocket | Non | Non | Non | Polling et WebRTC uniquement |
| OTA | Non | Non | Non | À introduire avec Expo/EAS |

---

## F. ÉTAT DU BACKEND

### Architecture

Le backend est un monolithe Express/TypeScript :

- entrée : `server/index.ts` ;
- routes principales : `server/routes.ts` ;
- accès aux données : `server/storage.ts` ;
- base : `server/db.ts` ;
- schéma : `shared/schema.ts` ;
- configuration Drizzle : `drizzle.config.ts`.

`server/routes.ts` contient un nombre important de domaines fonctionnels dans un même fichier. Cela fonctionne pour le Web actuel, mais une future consommation Mobile bénéficiera d’une organisation par modules ou domaines.

### API réellement présente

Les groupes suivants existent :

1. Authentification et session.
2. OTP et vérification.
3. Signalements et commentaires.
4. Likes, partages et gamification.
5. Notifications et Push.
6. Profils et utilisateurs.
7. Tracking et positions.
8. SOS et contacts d’urgence.
9. Panique et alertes.
10. Chatbot IA.
11. Actualités, événements et urgences.
12. Pharmacies et services urbains.
13. Places et vérifications.
14. Street View.
15. Visites virtuelles.
16. Ouaga3D.
17. Caméras et agents.
18. Sessions média.
19. Autorisation MediaMTX.
20. Météo, transport et établissements.

### Workers et tâches

Le serveur principal lance plusieurs tâches planifiées :

- actualisation des pharmacies ;
- actualisation des événements ;
- actualisation des urgences ;
- ingestion Ouaga3D ;
- synchronisation Overpass/OSM.

Le worker Street View est séparé :

```text
npm run dev:worker
npm run start:worker
```

Le build produit :

```text
dist/streetview-worker.js
```

Il n’est pas automatiquement lancé par le serveur principal.

### Risque multi-instance

Les timers du serveur principal peuvent être lancés dans chaque replica si Railway scale horizontalement. Cela peut provoquer :

- des synchronisations en double ;
- des appels externes répétés ;
- des courses entre workers ;
- une charge excessive ;
- des résultats non déterministes.

Les jobs Street View sont mieux structurés, avec leases et retries en base. Les timers plus anciens restent moins adaptés à un déploiement multi-instance.

### Temps réel

Il n’y a pas de WebSocket général.

Le système utilise :

- polling des notifications ;
- polling du tracking public ;
- polling des contributions Street View ;
- WebRTC/WHEP pour la surveillance vidéo ;
- MediaMTX pour le plan de contrôle vidéo.

Le tracking live n’est donc pas un flux WebSocket persistant.

---

## G. ÉTAT DE L’APPLICATION EXPO

L’application Expo est inexistante.

Il faut créer séparément :

```text
apps/mobile/
├── app.json ou app.config.ts
├── eas.json
├── package.json
├── src/
├── assets/
└── app/
```

### Conséquences

Il n’est pas possible actuellement de :

- générer un build iOS avec EAS ;
- générer un build Android avec EAS ;
- publier une mise à jour OTA ;
- configurer les permissions natives ;
- utiliser APNs ou FCM natifs ;
- utiliser une géolocalisation en arrière-plan native ;
- distribuer l’application sur les stores.

### Fonctionnalités nécessitant une implémentation mobile spécifique

- caméra ;
- sélection et compression vidéo ;
- géolocalisation en arrière-plan ;
- notifications push natives ;
- permissions ;
- stockage offline ;
- biométrie éventuelle ;
- partage de liens ;
- WebRTC mobile ;
- authentification persistante ;
- reprise réseau ;
- tâches en arrière-plan.

---

## H. ÉTAT EAS / OTA

### État actuel

Aucune configuration EAS ou OTA n’a été trouvée :

- pas de `eas.json` ;
- pas de `expo-updates` ;
- pas de `runtimeVersion` ;
- pas de channels ;
- pas de branches EAS Update ;
- pas de `updates.url` ;
- pas d’identifiant Expo Application Services ;
- pas de pipeline GitHub pour EAS.

### Ce que l’OTA peut couvrir

EAS Update peut distribuer :

- code JavaScript ;
- écrans ;
- logique métier JavaScript ;
- styles ;
- assets compatibles ;
- configuration non native compatible.

### Ce qui nécessite un build natif

Un nouveau build iOS/Android est nécessaire en cas de changement de :

- permission native ;
- configuration caméra ;
- push notification native ;
- APNs ou FCM ;
- localisation en arrière-plan ;
- WebRTC natif ;
- module Expo natif ;
- version de runtime ;
- plugin Expo ;
- configuration iOS/Android ;
- dépendance native ;
- icône ou splash selon le type de changement ;
- configuration App Store ou Play Store.

### Conclusion OTA

OTA est possible à terme, mais seulement après :

1. création de l’application Expo ;
2. premier build natif stable ;
3. configuration de `runtimeVersion` ;
4. définition de channels de production ;
5. mise en place d’une politique de compatibilité backend/mobile.

---

## I. CODE PARTAGEABLE

### Catégorie A — Partage direct recommandé

À partager dans un package neutre :

- types de données API ;
- DTO ;
- schémas de validation indépendants de Node et du navigateur ;
- enums métier ;
- statuts de signalement ;
- catégories ;
- règles de normalisation ;
- format des coordonnées ;
- états de synchronisation offline ;
- contrats de pagination ;
- contrats d’erreurs API ;
- version des endpoints.

Exemple recommandé :

```text
shared/contracts/
├── auth.ts
├── reports.ts
├── emergency.ts
├── tracking.ts
├── notifications.ts
├── places.ts
└── api.ts
```

### Catégorie B — Partageable après extraction

Certaines fonctions peuvent devenir portables :

- calcul de distance ;
- catégorisation des signalements ;
- règles de statut ;
- validation de coordonnées ;
- calculs de score ;
- règles de gamification ;
- préparation des payloads ;
- machine d’état offline ;
- logique de retry ;
- normalisation des erreurs.

Ces fonctions ne doivent dépendre ni de `window`, `document`, `localStorage`, IndexedDB, Express, Drizzle, Node.js ou secrets serveur.

### Catégorie C — À conserver séparée

#### Web uniquement

- React DOM ;
- Wouter ;
- Leaflet/react-leaflet ;
- Service Worker ;
- Web Push ;
- SpeechRecognition ;
- IndexedDB ;
- `localStorage` ;
- PWA manifest ;
- APIs navigateur.

#### Mobile uniquement

- Expo Router ou navigation native ;
- caméra native ;
- APNs/FCM ;
- permissions natives ;
- géolocalisation en arrière-plan ;
- SecureStore ;
- notifications natives ;
- stockage SQLite ou équivalent ;
- modules Expo.

#### Backend uniquement

- Express ;
- Drizzle ;
- `pg` ;
- sessions ;
- cookies ;
- accès secrets ;
- S3 credentials ;
- MediaMTX ;
- workers ;
- tâches planifiées ;
- logique de contrôle des permissions serveur.

### Règle importante

Il ne faut pas partager directement `server/storage.ts`, `server/routes.ts` ou les composants React Web avec Expo.

Le partage doit se faire par :

```text
contrats API + types + validation + logique pure
```

et non par import direct de modules serveur dans l’application mobile.

---

## J. AUTHENTIFICATION

### État Web actuel

Le système actuel combine :

- session Express ;
- stockage de sessions PostgreSQL ;
- Passport initialisé ;
- OTP ;
- magic links ;
- cookies HttpOnly ;
- rôles et contrôles d’autorisation ;
- CSRF côté navigateur.

Toutefois, l’intégration OIDC/Replit annoncée dans certaines documentations n’est pas réellement complète dans le code observé.

Le système effectif est principalement :

```text
OTP / session cookie / infrastructure Passport
```

et non une authentification OIDC complète prête à être consommée par une application native.

### Limites pour Mobile

Une application Expo ne doit pas dépendre uniquement de :

- cookies de navigateur ;
- attribut `SameSite` ;
- CSRF navigateur ;
- sessions implicites ;
- redirections Web.

Il faut prévoir :

```text
Access token court
        +
Refresh token rotatif
        +
Révocation par appareil/session
        +
Stockage SecureStore
```

### Points de sécurité à traiter

1. Stratégie officielle : OTP, OIDC ou les deux.
2. Authentification bearer pour Mobile.
3. Rotation des refresh tokens.
4. Hash des refresh tokens et magic links.
5. Régénération du SID après login.
6. Révocation par appareil.
7. CORS avec allowlist stricte.
8. Protection des endpoints sensibles.
9. Gestion des sessions Web et Mobile séparément.
10. Contrat d’erreurs stable.
11. Expiration et renouvellement.
12. Déconnexion globale ou par appareil.

### CORS

Aucun middleware CORS explicite et documenté n’a été confirmé dans la configuration backend actuelle.

Cela doit être traité avant une application Mobile distribuée sur une origine différente, sans utiliser :

```text
Access-Control-Allow-Origin: *
```

avec des credentials.

### Autorisation

L’autorisation existe, mais elle est dispersée :

- certains endroits utilisent des contrôles de rôle directs ;
- d’autres utilisent des contrôles d’ownership ;
- les contrôles admin ne sont pas totalement centralisés ;
- plusieurs handlers historiques accèdent directement aux claims utilisateur.

Une couche de permission commune et testée est recommandée avant d’exposer l’ensemble des fonctionnalités au Mobile.

---

## K. RAILWAY

### Build

Le problème de build précédent est compris et corrigé :

- le lockfile contenait 906 URLs internes Replit ;
- Railway ne pouvait pas les télécharger ;
- npm restait bloqué puis produisait `Exit handler never called!` ;
- Vite était ensuite absent.

Le lockfile actuel contient des URLs publiques npm et a été validé dans un environnement isolé avec :

```text
npm ci --include=dev --legacy-peer-deps
npm run build
npm run check
```

### Runtime actuel

Les logs Railway joints montrent que le build a réussi, puis que le conteneur a crashé au démarrage :

```text
Error: RAILWAY_DATABASE_URL doit être configuré en production.
```

Le serveur vérifie cette variable dans :

```text
server/index.ts
server/securityConfig.ts
```

avant même l’appel à `server.listen()`.

Le montage de volume :

```text
Mounting volume on: ...
```

est une étape normale et n’est pas l’erreur.

### Variables de production à vérifier

Dans le service applicatif Railway :

```text
RAILWAY_DATABASE_URL
SESSION_SECRET
REFRESH_TOKEN_SALT
MASTER_ENCRYPTION_KEY
```

ou, si KMS est activé :

```text
KMS_PROJECT_ID
KMS_LOCATION_ID
KMS_KEY_RING_ID
KMS_CRYPTO_KEY_ID
```

Pour Street View en production :

```text
STREETVIEW_S3_BUCKET
STREETVIEW_S3_ACCESS_KEY_ID
STREETVIEW_S3_SECRET_ACCESS_KEY
```

La présence d’une variable dans Replit ne signifie pas qu’elle existe dans Railway. Les deux environnements sont séparés.

### Configuration Railway active

Le dépôt ne contient actuellement pas de configuration Railway active versionnée :

- pas de `railway.json` ;
- pas de `railway.toml` ;
- pas de `nixpacks.toml` actif ;
- pas de Dockerfile racine ;
- `nixpacks.toml.unused` n’est pas utilisé automatiquement.

Railpack déduit donc une partie du pipeline à partir du dépôt et de ses variables externes.

### Démarrage

Le démarrage attendu est :

```text
NODE_ENV=production node dist/index.js
```

Le serveur écoute correctement :

```text
0.0.0.0:$PORT
```

Le port n’est donc pas le problème démontré par les logs actuels.

### Migrations

Le démarrage ne lance pas automatiquement les migrations. C’est cohérent avec la politique forward-only actuelle, mais cela signifie qu’un déploiement peut :

- réussir son build ;
- démarrer avec une base PostgreSQL dont le schéma n’est pas aligné ;
- retourner ensuite des erreurs 500 sur certaines routes.

Le journal Drizzle ne reflète pas clairement toutes les migrations présentes. Les fichiers `0001` à `0011` existent, tandis que le journal indique historiquement une situation incomplète.

Avant toute migration supplémentaire :

- confirmer le snapshot Railway ;
- confirmer sa restaurabilité ;
- confirmer l’état réel de `__drizzle_migrations` ;
- confirmer les tables et colonnes en production ;
- ne pas rejouer arbitrairement les anciennes migrations ;
- ne pas utiliser `db:push`.

### Worker

Le worker Street View est un processus distinct :

```text
npm run start:worker
```

Il ne doit pas être confondu avec le service HTTP principal. S’il est déployé sur Railway, il devra avoir :

- son propre service ;
- ses propres variables ;
- ses propres ressources ;
- une stratégie de concurrence et de lease ;
- une configuration de logs distincte.

---

## L. GITHUB / CI-CD

### État actuel

Aucun workflow GitHub Actions n’a été trouvé.

Il n’existe pas actuellement de :

```text
.github/workflows/
```

Le seul automatisme identifié est :

```text
scripts/post-merge.sh
```

Ce script exécute localement :

```text
npm ci
npm run check
npm run build
```

Il ne constitue pas une CI distante.

### Conséquences

Actuellement, rien ne garantit automatiquement :

- que le lockfile reste public après régénération ;
- que le build complet passe sur Node 20 ;
- que TypeScript passe ;
- que les migrations restent cohérentes ;
- que les contrats API ne régressent pas ;
- que le Web reste fonctionnel lorsqu’un module Mobile est ajouté.

### CI recommandée

Une CI minimale devrait vérifier :

```text
npm ci --include=dev --legacy-peer-deps
npm run check
npm run build
```

Puis progressivement :

```text
tests unitaires
tests API
tests contrats
audit lockfile
lint
tests migration en environnement temporaire
```

Aucune CI ne doit recevoir les secrets de production par défaut.

---

## M. RISQUES

### Critiques

#### 1. Runtime Railway non configuré

L’application ne démarre pas si `RAILWAY_DATABASE_URL` est absente.

**Impact :** crash-loop et site inaccessible.

#### 2. Authentification Mobile non définie

La session Web actuelle ne suffit pas pour une application Expo native.

**Impact :** impossibilité de partager proprement login, refresh, logout et sessions.

#### 3. Divergence potentielle du schéma PostgreSQL

Le code, les migrations et le journal Drizzle ne sont pas totalement alignés historiquement.

**Impact :** application qui build mais échoue sur certaines routes en production.

#### 4. Absence de CI

Les erreurs de build et de contrats peuvent revenir sans être détectées.

**Impact :** régressions déployées directement.

### Élevés

#### 5. Données personnelles et géolocalisation

Le système manipule :

- email ;
- téléphone ;
- GPS ;
- trajectoires ;
- contacts d’urgence ;
- alertes de panique ;
- médias ;
- données de profil.

Certaines données sont stockées ou exposées sans stratégie de minimisation et de rétention complètement centralisée.

#### 6. Contrôles d’autorisation dispersés

Des contrôles admin et ownership existent mais ne sont pas uniformisés.

**Impact :** risque d’IDOR ou d’élévation de privilège lors de l’ajout de nouveaux clients.

#### 7. Création publique de visites virtuelles

La création de tours virtuels semble accessible publiquement et accepte plusieurs images base64.

**Impact :** abus de stockage, contenu non modéré, charge élevée.

#### 8. Uploads base64

Les signalements utilisent des médias base64 dans des payloads JSON.

**Impact :**

- augmentation importante de la taille des requêtes ;
- consommation mémoire ;
- difficulté côté Mobile ;
- risques de timeout ;
- difficulté d’upload reprenable.

#### 9. Timers dans le serveur HTTP

Plusieurs tâches planifiées démarrent dans le processus serveur.

**Impact :** exécutions dupliquées en cas de réplication Railway.

### Moyens

#### 10. Push Web non équivalent au Push natif

La PWA utilise Web Push/VAPID, mais Mobile aura besoin d’APNs/FCM.

#### 11. Offline partiel

Le Web dispose d’un offline utile mais incomplet :

- signalements : file d’attente ;
- SOS : pas de file d’attente offline équivalente ;
- tracking : pas de garantie de reprise ;
- Street View : pas de file d’attente offline ;
- surveillance : non offline.

#### 12. Surveillance multi-instance

Certains grants vidéo sont en mémoire.

**Impact :** problèmes possibles après redémarrage ou avec plusieurs replicas.

#### 13. Pas de WebSocket général

Le système fonctionne avec polling. Cela peut être acceptable, mais les besoins temps réel Mobile devront être évalués.

#### 14. Reconstruction 3D non validée

Le pipeline vidéo CPU est préparé, mais il ne faut pas annoncer une reconstruction 3D opérationnelle.

#### 15. CSP permissive

La configuration de sécurité permet notamment des usages comme `unsafe-inline`/`unsafe-eval`, à réévaluer.

---

## N. MODIFICATIONS NÉCESSAIRES

Cette section décrit les modifications futures. Aucune n’a été appliquée pendant l’audit.

### Priorité 0 — Production Railway

Configuration externe, sans modification applicative initiale :

1. Ajouter `RAILWAY_DATABASE_URL` dans le service Railway.
2. Vérifier `SESSION_SECRET`.
3. Vérifier `REFRESH_TOKEN_SALT`.
4. Vérifier la configuration KMS ou `MASTER_ENCRYPTION_KEY`.
5. Vérifier les variables S3.
6. Relancer un déploiement.
7. Vérifier le démarrage HTTP et les logs.
8. Confirmer que `GET /` répond correctement.

### Priorité 1 — Contrats API

Nouveaux fichiers recommandés :

```text
shared/contracts/
shared/domain/
```

À y placer :

- types de réponses ;
- pagination ;
- erreurs ;
- signalements ;
- auth ;
- tracking ;
- notifications ;
- places ;
- uploads.

### Priorité 2 — Authentification Mobile

Fichiers backend concernés :

```text
server/securityConfig.ts
server/replitAuth.ts
server/hybridAuthService.ts
server/authorization.ts
server/routes.ts
server/storage.ts
shared/schema.ts
```

Travail prévu :

- définir bearer access token ;
- définir refresh token rotatif ;
- révoquer par appareil ;
- hacher les tokens persistés ;
- ajouter CORS allowlist ;
- stabiliser logout ;
- ajouter tests de session ;
- conserver le flux Web existant pendant la transition.

### Priorité 3 — Création Expo

Nouveaux fichiers :

```text
apps/mobile/
app.json ou app.config.ts
eas.json
```

À définir :

- bundle identifier iOS ;
- package Android ;
- icônes ;
- splash screen ;
- permissions ;
- scheme ;
- runtime version ;
- channels EAS.

### Priorité 4 — API client partagé

Créer un client Mobile dédié et un contrat commun, sans importer le serveur :

```text
shared/contracts/
apps/mobile/src/api/
```

### Priorité 5 — Fonctionnalités mobiles par tranches

Ordre recommandé :

1. connexion/profil ;
2. lecture du fil ;
3. carte et recherche ;
4. création de signalement ;
5. upload photo ;
6. SOS ;
7. notifications ;
8. offline ;
9. géolocalisation arrière-plan ;
10. vidéo Street View ;
11. surveillance vidéo ;
12. fonctionnalités avancées.

### Priorité 6 — EAS et OTA

Ajouter :

- EAS Build ;
- EAS Update ;
- channels `preview`, `staging`, `production` ;
- `runtimeVersion` ;
- pipeline de publication contrôlé ;
- compatibilité backend/mobile.

### Priorité 7 — CI/CD

Ajouter une CI GitHub pour :

- install propre ;
- lockfile ;
- TypeScript ;
- build Web ;
- tests backend ;
- tests contrats ;
- build Expo preview ;
- validation des migrations en environnement isolé.

---

## O. PLAN DE MIGRATION

### Phase 0 — Stabilisation Railway

**Objectif :** obtenir un backend Web production stable.

**Travail :**

- variables Railway ;
- build public npm ;
- démarrage production ;
- healthcheck ;
- logs ;
- vérification S3 ;
- vérification base.

**Risques :**

- variables absentes ;
- schema drift ;
- volume ou S3 mal configuré.

**Validation :**

- `npm ci` terminé ;
- build réussi ;
- serveur reste actif ;
- `GET /` répond ;
- endpoints API principaux répondent.

### Phase 1 — Baseline PostgreSQL et contrats

**Objectif :** établir une référence fiable du backend actuel.

**Travail :**

- confirmer snapshot ;
- confirmer restauration ;
- comparer le schéma réel ;
- documenter les migrations appliquées ;
- figer les contrats API existants.

**Validation :**

- snapshot identifié ;
- restauration testée ;
- aucun `db:push` ;
- aucun replay aveugle de migrations.

### Phase 2 — Stabilisation de l’authentification

**Objectif :** permettre Web + Mobile sans casser le Web.

**Travail :**

- conserver les sessions Web ;
- ajouter une authentification bearer Mobile ;
- définir refresh tokens rotatifs ;
- centraliser permissions et ownership ;
- ajouter CORS contrôlé.

**Validation :**

- login Web ;
- login Mobile simulé ;
- refresh ;
- logout ;
- révocation ;
- permissions ;
- régression Web.

### Phase 3 — Extraction des contrats partagés

**Objectif :** partager les types et validations, pas l’UI.

**Travail :**

- `shared/contracts` ;
- erreurs API ;
- pagination ;
- modèles transportables ;
- logique métier pure.

**Validation :**

- Web compile ;
- backend compile ;
- package partagé utilisable par Mobile.

### Phase 4 — Création de l’application Expo minimale

**Objectif :** créer une application qui se connecte au backend.

**Travail :**

- Expo ;
- navigation ;
- configuration EAS ;
- SecureStore ;
- écran de connexion ;
- profil ;
- environnement preview.

**Validation :**

- build iOS de développement ;
- build Android de développement ;
- connexion réussie ;
- logout ;
- session persistante.

### Phase 5 — Première parité fonctionnelle

**Objectif :** livrer un premier Mobile utile.

Ordre :

1. fil ;
2. signalement texte ;
3. photo ;
4. carte ;
5. profil ;
6. SOS ;
7. notifications.

**Validation :**

- tests API ;
- tests Web ;
- tests iOS ;
- tests Android ;
- tests réseau lent ;
- perte de connexion.

### Phase 6 — Fonctionnalités natives avancées

**Objectif :** exploiter les capacités natives.

**Travail :**

- localisation arrière-plan ;
- push APNs/FCM ;
- caméra vidéo ;
- Street View ;
- upload reprenable ;
- offline avancé ;
- surveillance si nécessaire.

**Validation :**

- permissions refusées ;
- batterie ;
- arrière-plan ;
- reprise réseau ;
- upload interrompu ;
- iOS et Android réels.

### Phase 7 — EAS Build et OTA

**Objectif :** distribuer de manière contrôlée.

**Travail :**

- channels ;
- runtime version ;
- builds preview ;
- staging ;
- production ;
- rollback OTA.

**Validation :**

- OTA JavaScript ;
- rollback ;
- changement natif détecté ;
- compatibilité API ;
- version incompatible refusée proprement.

### Phase 8 — CI/CD complète

**Objectif :** rendre l’architecture maintenable par une équipe.

**Travail :**

- CI Web ;
- CI backend ;
- CI contrats ;
- CI Mobile ;
- build EAS preview ;
- contrôles migrations ;
- checks de sécurité.

**Validation :**

- Pull Request verte ;
- artefacts reproductibles ;
- déploiement contrôlé ;
- aucun secret dans les logs.

---

## P. MATRICE DE TEST

| Fonction | Web | iOS | Android | API | OTA |
|---|---:|---:|---:|---:|---:|
| Inscription OTP | Oui | À ajouter | À ajouter | Oui | Non |
| Connexion | Oui | À ajouter | À ajouter | Oui | Non |
| Refresh session | Session Web | À concevoir | À concevoir | À tester | Non |
| Logout | Oui | À ajouter | À ajouter | Oui | Non |
| Révocation appareil | Partiel | À concevoir | À concevoir | À ajouter | Non |
| Création signalement | Oui | À ajouter | À ajouter | Oui | Non |
| Upload photo | Oui | À ajouter | À ajouter | Oui | Non |
| Upload vidéo | Partiel | À ajouter | À ajouter | Oui | Non |
| SOS | Oui | À ajouter | À ajouter | Oui | Non |
| Géolocalisation foreground | Oui | À ajouter | À ajouter | Oui | Non |
| Géolocalisation background | Non confirmé | À ajouter | À ajouter | À concevoir | Non |
| Carte | Oui | À ajouter | À ajouter | Oui | Oui si JS |
| Recherche | Oui | À ajouter | À ajouter | Oui | Oui si JS |
| Notifications Web | Oui | Non | Non | Oui | Partiel |
| Notifications APNs/FCM | Non | À ajouter | À ajouter | À ajouter | Non |
| Profil | Oui | À ajouter | À ajouter | Oui | Oui |
| Signalements offline | Partiel | À concevoir | À concevoir | Oui | Oui si JS |
| SOS offline | Non | À concevoir | À concevoir | Oui | Non |
| Reconnexion réseau | Partiel | À tester | À tester | Oui | Oui |
| Pharmacies | Oui | À ajouter | À ajouter | Oui | Oui |
| Urgences | Oui | À ajouter | À ajouter | Oui | Oui |
| Actualités | Oui | À ajouter | À ajouter | Oui | Oui |
| Événements | Oui | À ajouter | À ajouter | Oui | Oui |
| Chatbot | Oui | À ajouter | À ajouter | Oui | Oui |
| Street View vidéo | Web | À ajouter | À ajouter | Oui | Non si module natif |
| Processing Street View | Serveur | Indirect | Indirect | Oui | Non |
| Surveillance | Web | À étudier | À étudier | Oui | Non si natif |
| Permissions caméra | Web | À ajouter | À ajouter | Non | Non |
| Permissions localisation | Web | À ajouter | À ajouter | Non | Non |
| Auth admin | Partiel | À décider | À décider | À sécuriser | Non |
| Migration DB | N/A | N/A | N/A | À valider | N/A |
| Build Web | Oui | N/A | N/A | N/A | N/A |
| Build natif | N/A | À ajouter | À ajouter | N/A | N/A |
| OTA JS | N/A | À ajouter | À ajouter | N/A | Oui |
| Changement natif | N/A | Nouveau build | Nouveau build | N/A | Non |

---

## Q. VERDICT FINAL

### 1. Peut-on conserver le BurkinaWatch Web actuel comme version principale ?

**Oui.**

C’est la stratégie recommandée. Le Web possède déjà la majorité des fonctionnalités métier et doit rester la référence fonctionnelle.

### 2. Peut-on avoir une application Expo native utilisant le même backend ?

**Oui, mais pas immédiatement sans travail d’adaptation.**

Le backend est suffisamment riche pour être partagé, mais il faut ajouter :

- auth bearer Mobile ;
- CORS contrôlé ;
- API contracts ;
- stockage sécurisé des tokens ;
- endpoints stables ;
- tests de contrat.

### 3. Peut-on avoir les mêmes fonctionnalités Web et Mobile ?

**Oui à terme, mais pas avec le même code d’interface.**

Les fonctionnalités peuvent être équivalentes, mais :

- le Web utilisera DOM, Leaflet, Service Worker et Web Push ;
- le Mobile utilisera caméra native, APNs/FCM, géolocalisation native et stockage natif.

### 4. Peut-on partager la logique métier ?

**Oui, partiellement et progressivement.**

Il faut partager :

- types ;
- contrats ;
- validation ;
- logique pure ;
- règles métier indépendantes de la plateforme.

Il ne faut pas partager directement les composants React Web, les routes Express ou le DAO Drizzle.

### 5. Peut-on utiliser EAS Update / OTA ?

**Oui, après création et stabilisation de l’application Expo.**

OTA couvrira les changements JavaScript compatibles. Les changements natifs nécessiteront toujours un nouveau build iOS/Android.

### 6. Quelles modifications sont nécessaires ?

Les principales modifications futures sont :

1. stabiliser Railway ;
2. vérifier PostgreSQL et les migrations ;
3. définir l’auth Mobile ;
4. ajouter CORS contrôlé ;
5. créer les contrats partagés ;
6. créer `apps/mobile` ;
7. configurer EAS Build ;
8. configurer EAS Update ;
9. ajouter CI/CD ;
10. tester la parité Web/Mobile.

### 7. Quels éléments nécessitent un nouveau build natif ?

Notamment :

- caméra ;
- push APNs/FCM ;
- localisation arrière-plan ;
- WebRTC natif ;
- permissions ;
- modules Expo natifs ;
- dépendances natives ;
- changements de runtime ;
- configuration iOS/Android.

### 8. Quel est le risque de casser le Web ?

Le risque peut rester faible si l’évolution est additive.

Il devient élevé si l’on :

- réécrit le frontend Web en React Native ;
- modifie brutalement l’authentification ;
- rejoue des migrations sans baseline ;
- change les contrats API sans version ;
- mélange code serveur et code mobile ;
- remplace les sessions Web sans période de transition.

### 9. Quelle est la stratégie la plus sûre ?

```text
1. Stabiliser Railway
2. Vérifier la base et les migrations
3. Geler les contrats Web actuels
4. Ajouter une auth Mobile séparée
5. Extraire types et logique pure
6. Créer Expo dans un dossier séparé
7. Ajouter les fonctionnalités par tranches
8. Ajouter EAS Build
9. Activer OTA après un premier build stable
10. Mettre en place CI et tests de contrat
```

### 10. Quel doit être le PREMIER changement après cet audit ?

Le premier changement ne doit pas être Expo.

Il faut d’abord stabiliser l’environnement de production Railway :

1. ajouter `RAILWAY_DATABASE_URL` au bon service Railway ;
2. vérifier `REFRESH_TOKEN_SALT` ;
3. vérifier la clé d’encryption ou KMS ;
4. vérifier le stockage S3 Street View ;
5. relancer l’application ;
6. confirmer que le serveur reste actif et répond sur `0.0.0.0:$PORT` ;
7. confirmer l’état réel de PostgreSQL et des migrations.

Une fois cette base validée, le premier changement applicatif recommandé est la définition d’un **contrat API partagé et versionné**, avant de créer l’application Expo.

---

## Conclusion opérationnelle

BurkinaWatch peut évoluer vers :

```text
Web principal
+ application Expo native
+ backend commun
+ PostgreSQL commun
+ logique métier partagée
+ EAS Build
+ EAS Update / OTA
+ Railway
```

La voie la plus sûre consiste à conserver le Web intact, stabiliser Railway et PostgreSQL, concevoir l’authentification Mobile, puis ajouter Expo dans un espace séparé avec des contrats API explicites.