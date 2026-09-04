# BurkinaWatch — Phase 5

## Prototype live vidéo contrôlé

**Recommandation : `LOCAL ONLY`**  
**Verdict : `READY WITH CONDITIONS`**

Cette phase valide le chemin technique avec une source synthétique. Elle ne
connecte aucune caméra réelle, ne déploie aucun gateway en production et
n'ajoute aucune donnée vidéo à PostgreSQL.

## A. Architecture finale du prototype

```text
FFmpeg testsrc2 + sine
        │ RTSP publish (localhost:8554/phase5-test)
        ▼
MediaMTX 1.12.3
        │ WHEP / WebRTC (localhost:8889)
        ▼
BurkinaWatch control plane (Express)
        │ session authentifiée + grant temporaire
        ▼
Navigateur
```

Express ne transporte jamais les paquets vidéo. Il vérifie l'utilisateur,
crée le path logique, délivre un grant court et révoque la session. MediaMTX
porte le flux RTSP/WebRTC.

## B. Video Gateway

- Technologie : MediaMTX `1.12.3`.
- Adaptateur : `server/mediaMtxGateway.ts`, derrière le contrat
  `VideoGateway`.
- Control API : `http://127.0.0.1:9997`, uniquement pour le contrôle backend.
- WebRTC/WHEP : `http://127.0.0.1:8889`.
- Authentification MediaMTX : callback HTTP vers
  `/api/surveillance/media-auth`.
- Origine WebRTC locale autorisée : `http://localhost:5000`.
- Le gateway est séparé du processus Express et peut rester démarré sans le
  backend.

Variables utilisées par le backend lorsque le prototype est activé :

```text
VIDEO_GATEWAY_ENABLED=true
VIDEO_GATEWAY_PROVIDER=mediamtx
VIDEO_GATEWAY_TEST_MODE=true
VIDEO_GATEWAY_API_URL=http://127.0.0.1:9997
VIDEO_GATEWAY_PUBLIC_ORIGIN=http://127.0.0.1:8889
```

Le mode test est refusé quand `NODE_ENV=production`. Hors mode test, le
backend exige un token API et des origines HTTPS.

## C. Source RTSP

La source est une mire générée par FFmpeg, sans fichier vidéo, caméra,
credential ou stockage :

- source : `testsrc2` + sinus audio ;
- codec vidéo : H.264, profil Constrained Baseline ;
- codec audio : AAC ;
- résolution : `1280x720` ;
- fréquence : `25 fps` ;
- débit configuré : vidéo `1800 kbit/s`, audio `96 kbit/s`.

Démarrage :

```bash
npm run phase5:gateway:up
npm run phase5:source
```

La commande `phase5:source` reste au premier plan et doit être arrêtée avec
`Ctrl-C`. Arrêt du gateway :

```bash
npm run phase5:gateway:down
```

## D. WebRTC

- Signaling : POST WHEP avec l'offre SDP et réponse SDP de MediaMTX.
- ICE : collecte locale avant l'envoi de l'offre.
- STUN : aucun serveur configuré ; le test est local.
- TURN : non déployé ; aucune preuve de besoin réseau dans ce prototype.
- Le navigateur utilise `RTCPeerConnection` avec transceivers vidéo/audio en
  réception uniquement.
- Le token viewer temporaire est envoyé par l'en-tête `Authorization` au
  WHEP, jamais ajouté à l'URL.

## E. Endpoints ajoutés

- `GET /api/surveillance/test-camera` — retourne la caméra virtuelle
  utilisateur uniquement lorsque le mode test est actif.
- `GET /api/surveillance/cameras/:id/live` — authentifie, vérifie l'identifiant
  opaque lié à l'utilisateur, enregistre le path et renvoie uniquement
  l'accès WHEP temporaire.
- `POST /api/surveillance/live/:sessionId/revoke` — révoque une session
  appartenant à l'utilisateur courant.
- `POST /api/surveillance/media-auth` — callback interne contrôlé par
  MediaMTX, validant les grants éphémères.

Les routes CRUD des caméras réelles restent disponibles pour la préparation,
mais leur live n'est pas activé en Phase 5. La caméra virtuelle n'est pas
insérée en base.

## F. Sécurité

- **Authentication** : toutes les routes navigateur sont protégées par la
  session existante.
- **Ownership** : l'identifiant de la caméra de test est dérivé de façon
  opaque de l'utilisateur ; l'identifiant d'un autre utilisateur renvoie
  `404`.
- **Tokens** : grants aléatoires, liés à l'utilisateur et au path, TTL de
  60 secondes, révoquables et nettoyés à expiration.
- **SSRF** : la source Phase 5 est une constante locale ; le gateway refuse
  les hôtes non locaux, les credentials, les query strings et les fragments.
- **Credentials** : aucun mot de passe caméra n'est chargé pour ce prototype.
  Les DTO CRUD ne contiennent pas les credentials.
- **Logs** : les tokens, passwords, credentials, SDP et informations ICE sont
  redacted par la couche de logs existante.
- **CORS/CSP** : aucune origine `*` n'est utilisée pour le WebRTC ; l'origine
  locale est explicitement configurée dans MediaMTX et les origines HTTPS du
  gateway sont limitées côté CSP.
- **Révocation** : l'arrêt du lecteur ferme le peer et révoque le grant ;
  désactiver ou supprimer une caméra enregistrée révoque aussi ses grants.

## G. Frontend

`client/src/pages/Surveillance.tsx` affiche une carte distincte `TEST LOCAL`
uniquement quand le backend expose le prototype. Le lecteur utilise un
élément `<video muted autoplay playsInline>` et ne reçoit jamais d'URL RTSP.

États implémentés :

```text
idle → connecting → live
                  ↘ offline
                  ↘ error
live → disconnected → reconnexion bornée avec backoff
```

La reconnexion est limitée à trois tentatives espacées. Toute fermeture
nettoie le `RTCPeerConnection`, la source vidéo et le grant serveur.

## H. Database

Aucune modification de schéma et aucune migration n'ont été nécessaires.
La caméra de test est virtuelle et liée à l'utilisateur en mémoire.

## I. Infrastructure

```text
Media Gateway deployed: NO (conteneur local utilisé pour validation)
Production: NO
Staging: NO
```

Le fichier `docker-compose.phase5.yml` ne doit pas être utilisé comme
configuration de production. L'image et les ports sont explicitement
destinés au poste de développement.

## J. Performance et mesures

Smoke test local effectué :

- MediaMTX `1.12.3` démarré avec RTSP, Control API et WebRTC ;
- path `phase5-test` prêt ;
- FFprobe a confirmé H.264 `1280x720` à `25 fps` et AAC ;
- le gateway a observé des données reçues par MediaMTX ;
- plusieurs grants viewers peuvent partager le même path sans créer un
  nouveau path source.

La latence navigateur de bout en bout et la consommation CPU multi-viewers
n'ont pas été mesurées dans cet environnement. Elles restent des conditions
avant toute décision de staging.

## K. Tests

```text
npm run check       PASS
npm run build       À exécuter après la dernière modification
git diff --check    PASS
security tests      PASS
video tests         PASS (19 tests ciblés)
regression tests    À compléter avec la suite complète du projet
```

Tests ciblés exécutés :

```bash
node --import tsx --test \
  server/__tests__/mediaMtxGateway.test.ts \
  server/__tests__/videoGateway.test.ts \
  server/__tests__/surveillancePreparation.test.ts \
  server/__tests__/surveillanceService.test.ts
```

Couvertures importantes : ownership A/B, caméra et token croisés, expiration,
révocation, credentials refusés, source non locale, gateway désactivé,
gateway HTTP simulé et plusieurs viewers.

## L. Problèmes rencontrés

- MediaMTX `1.12.3` utilise `webrtcAllowOrigin` au singulier ; la première
  configuration avec `webrtcAllowOrigins` a été refusée puis corrigée.
- FFmpeg disponible ici n'a pas établi de serveur RTSP avec `-rtsp_flags
  listen` ; la source finale publie vers le listener RTSP MediaMTX, ce qui
  est plus simple et reproductible.
- L'application de développement actuelle n'est pas activée avec les
  variables `VIDEO_GATEWAY_*`, donc le lecteur reste masqué dans le workflow
  standard.

## M. Risques restants

- Une origine HTTPS et une terminaison TLS sont nécessaires hors local.
- Il faut tester la chaîne sur le réseau réel de staging avant d'étudier
  STUN/TURN.
- Le callback MediaMTX doit recevoir un mécanisme d'authentification
  inter-services dédié si le gateway quitte la machine locale.
- La persistance multi-instance des grants mémoire doit être remplacée ou
  centralisée avant un déploiement horizontal.
- Les caméras CRUD réelles nécessitent une décision séparée sur le
  déchiffrement côté gateway et la politique SSRF avant d'être activées.

## N. Prochaine étape

Valider le prototype local dans un navigateur desktop et Android disponibles,
puis mesurer la reconnexion, la latence et le besoin éventuel de STUN/TURN
avant toute préparation de staging.

## O. Verdict

**READY WITH CONDITIONS**

Conditions : validation navigateur complète, mesures de performance, origine
HTTPS et revue réseau avant tout staging. Le prototype est **LOCAL ONLY** et
ne doit pas être promu automatiquement en production.