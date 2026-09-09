# Prompt 7 — Stabilisation et industrialisation de la vidéosurveillance

## A. Architecture réelle

```text
Caméra IP privée
      │ RTSP
      ▼
MediaMTX 1.12.3
      │ WHEP / WebRTC
      ▼
Navigateur authentifié

BurkinaWatch / Express
      └── control plane : ownership, test RTSP, configuration MediaMTX,
          grants temporaires, révocation et audit
```

Express ne transporte jamais le flux RTSP. Le navigateur ne reçoit jamais
l’URL RTSP, les credentials caméra ou les secrets MediaMTX.

## B. Code

### Fichiers créés pendant les phases 6 et 7

- `server/rtspConnection.ts`
- `server/__tests__/rtspConnection.test.ts`
- `docs/PHASE_6_REAL_CAMERA_INTEGRATION.md`
- `docs/PHASE_7_SURVEILLANCE_STABILISATION.md`

### Fichiers modifiés pendant les phases 6 et 7

- `.env.example`
- `client/src/pages/Surveillance.tsx`
- `server/mediaMtxGateway.ts`
- `server/routes.ts`
- `server/securityHardening.ts`
- `server/ssrfProtection.ts`
- `server/surveillancePrototype.ts`
- `server/surveillanceService.ts`
- `server/videoGateway.ts`
- `server/__tests__/mediaMtxGateway.test.ts`
- `server/__tests__/phase1Security.test.ts`
- `server/__tests__/videoGateway.test.ts`

### Fichiers supprimés

Aucun.

## C. Database

- Table du module : `surveillance_cameras`.
- Ownership : `owner_id` avec clé étrangère vers `users`.
- Credentials : `encrypted_password`.
- Statuts persistés : `unknown`, `online`, `offline`, `disabled`, `error`.
- Timestamps : `created_at`, `updated_at`, `last_seen_at`.
- Index présents :
  - `(owner_id, created_at)` ;
  - `(owner_id, status)`.
- Migration concernée : `migrations/0005_surveillance_cameras.sql`.
- `migrations/0004_runtime_alignment_draft.sql` et `0005_surveillance_cameras.sql`
  restent contrôlées séparément.
- Aucune migration n’a été exécutée dans cette phase.
- Aucun `db:push`, reset, suppression de tables ou migration destructive n’a
  été effectué.
- Les sessions viewer, grants et associations path MediaMTX restent en
  mémoire. C’est acceptable pour le test mono-instance, pas pour un passage
  multi-instance.

## D. Security

### Authentication

Les routes caméra et les routes de session viewer exigent une authentification.
Le callback MediaMTX n’utilise pas de cookie : il valide un grant viewer
temporaire.

### Authorization et ownership

Les lectures, créations, mises à jour, suppressions, tests de connexion, live,
statuts et révocations utilisent l’utilisateur authentifié. Les requêtes de
stockage filtrent simultanément par `camera_id` et `owner_id`.

### IDOR

Une caméra connue par son identifiant ne suffit pas à l’utiliser. Une caméra
d’un autre utilisateur produit une réponse contrôlée `404`, sans révéler son
existence opérationnelle. Les sessions viewer vérifient aussi `grant.userId`.

### SSRF

La protection reste active pour le test RTSP et l’enregistrement MediaMTX :

- loopback ;
- IPv6 loopback ;
- endpoints metadata ;
- link-local ;
- multicast ;
- adresses réservées ;
- protocoles non autorisés ;
- URLs avec structure invalide.

Les réseaux privés peuvent uniquement être autorisés par
`VIDEO_GATEWAY_ALLOW_PRIVATE_NETWORK=true`, dans un environnement hors
production où `VIDEO_GATEWAY_REAL_CAMERA_ENABLED=true`.

### Encryption et credentials

Les mots de passe caméra sont stockés comme enveloppes AES-256-GCM. Ils sont
déchiffrés uniquement en mémoire côté serveur, le temps d’un test RTSP ou de
la création d’un path gateway.

Le DTO public contient l’endpoint non secret et `hasCredentials`, mais jamais
le nom d’utilisateur, le mot de passe, l’URL RTSP complète, la clé de
chiffrement ou les credentials MediaMTX.

### Tokens et sessions

Les grants sont :

- aléatoires ;
- valides 60 secondes ;
- liés à l’utilisateur ;
- liés à la caméra ;
- liés au path MediaMTX ;
- révocables ;
- refusés s’ils sont expirés ou réutilisés sur un autre path.

Le nombre de viewers simultanés par caméra est configurable, avec une valeur
par défaut de 8 et une plage autorisée de 1 à 100.

### Logs et audit

Les réponses et erreurs sont redacted par les protections existantes. Les
événements caméra suivants sont journalisés sans secret :

- `camera_created` ;
- `camera_updated` / `camera_enabled` / `camera_disabled` ;
- `camera_deleted` ;
- `camera_connection_tested` ;
- `stream_started` / `stream_stopped` ;
- `viewer_session_created` / `viewer_session_revoked` ;
- `unauthorized_camera_access`.

### Rate limiting

- Gestion caméra : 30 mutations par IP et fenêtre de 15 minutes.
- Tests de connexion RTSP : 10 par IP et fenêtre de 15 minutes.
- Les limites coûteuses sont donc distinctes du trafic général.

## E. Live

### Caméra réelle

La gestion RTSP réelle est implémentée et explicitement désactivée en
production. Elle n’a pas été exécutée avec une caméra physique faute de
matériel et de réseau privé disponibles.

### RTSP

La sonde serveur effectue un `DESCRIBE`, applique un timeout et supporte
Basic/Digest. Elle retourne uniquement un résultat abstrait.

### Gateway

MediaMTX reçoit une source RTSP configurée par Express. Les paths réels sont
opaques et dérivés par HMAC. Les sources synthétiques restent confinées au
prototype local.

### Statuts séparés

Les API et l’interface distinguent désormais :

- `cameraStatus` : dernier état connu de la caméra ;
- `streamStatus` : état du path MediaMTX ;
- `viewerStatus` : état du lecteur navigateur.

Un endpoint protégé existe également :

```text
GET /api/surveillance/cameras/:id/status
```

Il ne lance pas de scan réseau implicite. Le test RTSP reste une action
explicite, ce qui évite une requête agressive par caméra.

### Navigateur

Le lecteur conserve les états :

- idle ;
- connecting ;
- live ;
- reconnecting ;
- offline ;
- error ;
- stopped/idle après arrêt.

La reconnexion est progressive et limitée à trois tentatives.

### Mobile

Aucun artefact mobile Expo ou application native n’est présent dans ce projet.
Le lecteur livré est donc validé pour le navigateur uniquement. Une validation
mobile séparée est nécessaire avant de revendiquer le support natif.

## F. Performance

Tests logiciels réalisés :

- plusieurs grants sur un même path ;
- limite configurable de viewers ;
- expiration et révocation ;
- plusieurs caméras logiques via des identifiants indépendants.

Mesures non disponibles dans cet environnement :

- latence RTSP/WebRTC ;
- CPU et RAM MediaMTX ;
- 1 caméra / 2 viewers avec navigateur réel ;
- plusieurs caméras physiques simultanées ;
- stabilité longue durée.

MediaMTX est conçu pour mutualiser une source par path ; le gateway réutilise
le path déjà enregistré pour une caméra au lieu d’ajouter un flux RTSP par
viewer.

## G. Network

- LAN : stratégie prévue ; non exécutée avec caméra physique.
- WAN : non validé.
- NAT / CGNAT : non validés.
- STUN : aucun serveur imposé par défaut.
- TURN : non ajouté par défaut ; à décider seulement après test distant.
- RTSP public : interdit comme stratégie de contournement.
- Pour une caméra derrière CGNAT, l’architecture future recommandée est un
  agent local qui établit une connexion sortante sécurisée vers
  l’infrastructure BurkinaWatch.

## H. Tests et vérifications exactes

- `npm run check` : réussi.
- `npm run build` : réussi.
- `node --import tsx --test server/__tests__/*.test.ts` :
  **52 tests réussis, 0 échec**.
- `git diff --check` : réussi.
- Serveur local : répond sur `0.0.0.0:5000`.
- Requête HTTP racine locale : `200`.
- Accès anonyme à Surveillance : refusé par authentification.
- Tests RTSP : réponse 200, Basic auth, timeout/endpoint inaccessible,
  absence de fuite des credentials.
- Tests SSRF : adresses privées bloquées par défaut et acceptées uniquement
  avec option explicite ; loopback toujours bloqué.
- Tests sécurité : ownership, DTO public, redaction, CSRF, tokens et
  isolation inter-utilisateurs.
- Build frontend inspecté : aucun secret serveur n’est embarqué.
- Smoke test MediaMTX/FFmpeg synthétique Phase 5 : réussi précédemment.
- Caméra réelle, navigateur WebRTC sur caméra physique, NAT, TURN et mesures
  de performance : non exécutés, infrastructure absente.

## I. Risques et travail restant

1. Appliquer la migration 0005 séparément dans un environnement autorisé.
2. Réaliser le test avec une caméra physique et un réseau privé/VPN.
3. Vérifier les codecs, la latence, les pertes et les reconnexions réelles.
4. Tester desktop et mobile séparément si un client mobile est ajouté.
5. Remplacer l’état mémoire des paths et grants avant le multi-instance.
6. Ajouter des métriques persistantes ou partagées pour online/offline,
   erreurs RTSP, erreurs WebRTC et sessions actives.
7. Ajouter un heartbeat périodique seulement après validation d’une politique
   de fréquence et de capacité ; actuellement le statut réseau reste
   volontairement on-demand.
8. Tester le comportement exact de MediaMTX lorsqu’il n’y a plus de viewer
   avant d’ajouter une logique d’arrêt automatique RTSP.

## J. Verdict

### READY WITH CONDITIONS

Le module est suffisamment stabilisé pour une préproduction contrôlée. Il
n’est pas encore prêt pour une validation de production ou pour déclarer la
chaîne physique Camera → RTSP → MediaMTX → WebRTC → navigateur comme validée.
