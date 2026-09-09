# BurkinaWatch — Phase 4

## Surveillance — audit et préparation du transport vidéo

Date du rapport : 4 septembre 2026

## A. Architecture actuelle

BurkinaWatch reste une application React/Vite avec un backend Express et
PostgreSQL via Drizzle. Express est le control plane : authentification,
ownership, métadonnées caméra, credentials chiffrés et audit.

L’audit du dépôt ne trouve aucun media plane actif. Il n’y a pas de MediaMTX,
go2rtc, FFmpeg, GStreamer, LiveKit, Janus, serveur TURN/STUN, HLS, WebRTC
distant, signaling vidéo ou WebSocket vidéo installé/configuré.

Les références RTSP/ONVIF concernent uniquement le modèle de métadonnées caméra
et la préparation de la Phase 3. La capture vidéo présente dans
`client/src/pages/StreetView.tsx` est une capture locale de contribution et
ne constitue pas un lecteur de caméra IP distante.

## B. Architecture recommandée

```text
Caméra IP
    │ RTSP local
    ▼
Agent caméra local (à évaluer, non développé ici)
    │ connexion sortante authentifiée
    ▼
Gateway vidéo séparé — media plane
    │ WebRTC/WHEP sur HTTPS
    ▼
Navigateur
    ▲
    │ autorisation temporaire, jamais le credential caméra
    │
Backend Express — control plane
```

L’agent local est l’option la plus robuste pour les caméras derrière NAT ou
CGNAT : il ne demande ni redirection de port 554 ni exposition de la caméra.
Pour un pilote contrôlé, un gateway séparé peut recevoir une source de test
explicitement autorisée. Express ne doit jamais transporter les paquets vidéo.

## C. Media Gateway recommandé

**MediaMTX est le candidat recommandé à évaluer, mais il n’est pas retenu comme
déploiement de cette phase.**

La documentation officielle MediaMTX décrit :

- la lecture et la publication WebRTC et RTSP ;
- des paths séparés pour plusieurs flux ;
- l’authentification interne, HTTP ou JWT ;
- une Control API désactivée par défaut ;
- des réglages RTSP TCP/UDP et WebRTC ;
- l’utilisation possible d’un serveur TURN/Coturn pour les cas difficiles.

Sources consultées le 4 septembre 2026 :

- <https://mediamtx.org/docs/features/read>
- <https://mediamtx.org/docs/features/authentication>
- <https://mediamtx.org/docs/features/control-api>
- <https://mediamtx.org/docs/features/webrtc-specific-features>
- <https://github.com/bluenviron/mediamtx>

## D. Pourquoi ce choix

MediaMTX correspond au besoin RTSP → WebRTC sans imposer qu’Express devienne
un proxy média. Il fournit une séparation par path et des mécanismes
d’authentification adaptés à une intégration future.

Ce choix reste conditionnel : il faudra mesurer la compatibilité codec,
la latence, la consommation CPU/mémoire, les échecs de reconnexion et le
comportement sous charge avec une source de test. Aucun benchmark n’a été
présenté comme réalisé dans cette phase.

## E. NAT / CGNAT

L’architecture « Internet → IP publique utilisateur → port 554 → caméra » est
interdite. Elle échoue notamment avec la 4G/5G et le CGNAT, augmente la surface
d’attaque et rend les règles firewall difficiles à contrôler.

La décision recommandée est une connexion sortante d’un agent local vers le
gateway. Un mode direct ne doit être accepté que dans un environnement de
test explicitement isolé et documenté.

## F. WebRTC

Le navigateur devra utiliser un contexte sécurisé HTTPS et un signaling
authentifié. Le gateway devra fournir l’offre/réponse ou WHEP selon le choix
final, tandis qu’Express autorisera uniquement une session courte et limitée
à l’utilisateur et à la caméra.

Les éléments à valider lors du pilote sont ICE, les ports UDP, le fallback
TCP/TLS, les certificats, Chrome/Android/iOS et les reconnexions du navigateur.

## G. STUN / TURN

STUN peut permettre une connectivité directe, mais TURN devient nécessaire
lorsque les pairs ne peuvent pas établir de chemin direct à cause du NAT
symétrique, du CGNAT ou de firewalls restrictifs. TURN relaie la vidéo et
devient donc une contrainte de bande passante et de sécurité.

Ne pas déployer TURN avant un test de connectivité représentatif. Le candidat
à évaluer est Coturn sur une infrastructure séparée, avec credentials
temporaires et quotas. La documentation WebRTC officielle confirme le rôle de
relais TURN :
<https://webrtc.org/getting-started/turn-server>.

## H. RTSP

RTSP est le transport d’entrée de la caméra vers l’agent ou le gateway. Les
credentials ne doivent jamais être placés dans une URL envoyée au frontend,
dans Git ou dans les logs. Le gateway devra appliquer des timeouts, limiter les
retries et vérifier l’adresse réellement connectée.

Une source RTSP de test locale ou un générateur de flux est préférable à une
caméra réelle pour le premier pilote.

## I. ONVIF

ONVIF peut servir à la découverte, l’identification et la configuration
ultérieures. Il ne doit pas être confondu avec le transport vidéo RTSP.
ONVIF n’est pas utilisé pour scanner les réseaux privés depuis le cloud et
aucune découverte automatique n’est ajoutée ici.

## J. Sécurité

Les garde-fous existants restent obligatoires : session authentifiée,
ownership, AES-256-GCM, redaction, `no-store`, rate limit et audit. Le
frontend ne reçoit qu’un `cameraId` et, à terme, une autorisation temporaire ;
jamais le username ou le mot de passe caméra.

Les fonctions interdites par le document de phase — enregistrement, replay,
stockage vidéo, IA, reconnaissance faciale, alertes et snapshots — ne sont pas
implémentées.

## K. SSRF

La validation actuelle de l’endpoint ne crée aucune connexion. La future
connexion sortante devra être effectuée dans l’agent/gateway avec une
allow-list explicite, une résolution contrôlée, une protection contre les
redirections et une limite de temps. Express ne doit pas devenir un scanner
réseau ni recevoir une exception SSRF globale.

## L. Authentication / Authorization

Le chemin d’autorisation recommandé est :

1. session utilisateur authentifiée ;
2. recherche caméra avec `ownerId` côté serveur ;
3. caméra active et non désactivée ;
4. autorisation courte limitée à `userId` et `cameraId` ;
5. appel du gateway avec un contexte serveur, sans credential caméra côté
   navigateur.

Le nouveau contrat `server/videoGateway.ts` centralise la validation
d’ownership, d’état et de token avant un futur adaptateur. Il n’ajoute aucune
route live.

## M. Token vidéo

Les claims préparés restent courts, expirants, associés à un utilisateur, une
caméra, un scope `surveillance:stream` et un identifiant unique. Le contrat
refuse l’expiration absente, les tokens expirés et les tokens réutilisés pour
une autre caméra.

La signature, la révocation et l’échange avec le gateway restent à spécifier
avant une mise en production. Un simple `cameraId` ou un path devinable ne
constitue jamais une autorisation.

## N. Database

Le schéma caméra de Phase 3 n’est pas étendu par la Phase 4. La migration
`0005_surveillance_cameras.sql` reste forward-only et n’a pas été appliquée
automatiquement à Railway.

Le media plane ne doit stocker aucun flux vidéo dans PostgreSQL. Les états
`online`, `offline`, `disabled` et `error` sont actuellement des métadonnées ;
aucun probe réseau n’est activé.

## O. Backend

Modifications de cette phase :

- `server/videoGateway.ts` : contrat control plane, configuration désactivée
  par défaut, validation et adaptateur indisponible contrôlé ;
- `server/__tests__/videoGateway.test.ts` : tests de configuration,
  ownership, état caméra, scope et indisponibilité du gateway.

Aucun client MediaMTX, appel HTTP gateway, socket, worker ou route vidéo n’est
ajouté.

## P. Frontend

Aucune modification frontend n’est nécessaire dans cette phase. L’écran
Surveillance de Phase 3 reste sans lecteur fictif et sans credential.

## Q. Infrastructure

Rien n’a été déployé :

- pas de MediaMTX ;
- pas de service vidéo Railway ;
- pas de port RTSP ou UDP public ;
- pas de TURN/STUN ;
- pas de caméra réelle ;
- pas d’ouverture firewall ou routeur.

La documentation Railway consultée décrit le public networking orienté
HTTP/HTTPS et les domaines SSL :
<https://docs.railway.com/reference/public-networking>.
Cela ne suffit pas à considérer Railway comme un déploiement WebRTC/UDP
validé. Un service média séparé doit être évalué pour les besoins UDP,
signaling et TURN.

## R. Tests

```text
npm run check       PASS
npm run build       PASS
git diff --check    PASS
security tests      PASS
video tests         PASS
```

Les tests vidéo sont des tests de contrat et d’autorisation ; ils ne se
connectent à aucune caméra et ne valident pas encore un transport WebRTC réel.

## S. Risques restants

- absence de test end-to-end RTSP → WebRTC ;
- absence de benchmark CPU, mémoire, bitrate et latence ;
- choix Railway versus infrastructure média séparée non validé par un pilote ;
- TURN, NAT/CGNAT et compatibilité mobile non testés ;
- signature/révocation de l’autorisation gateway à finaliser ;
- absence d’adaptateur MediaMTX réellement connecté ;
- absence de tests HTTP des routes caméra, déjà identifié comme suivi de
  sécurité ;
- migration caméra toujours en attente de validation de la base approuvée.

## T. Prochaine étape recommandée

Valider d’abord les tests HTTP d’ownership de la Phase 3, puis préparer un
environnement de test isolé avec une source RTSP synthétique. Mesurer ensuite
un gateway séparé avec un seul flux non sensible, sans caméra de production.
Le pilote devra documenter ICE, codec, reconnexion, offline, CORS/CSP, quotas
et la nécessité réelle de TURN avant toute activation.

## U. Verdict

**READY WITH CONDITIONS**

La préparation du transport vidéo est suffisamment cadrée pour un pilote
isolé, mais elle n’est pas prête pour une caméra réelle, un flux public ou un
déploiement de production. La Phase 5 ne démarre pas automatiquement.